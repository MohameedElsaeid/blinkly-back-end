import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import * as sharp from 'sharp';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { QrCode } from '../entities/qr-code.entity';
import { User } from '../entities/user.entity';
import { Link } from '../entities/link.entity';
import { CreateQrCodeDto } from './dto/create-qr-code.dto';

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);
  private readonly s3Client: S3Client;
  private readonly spacesEndpoint = process.env.DIGITAL_OCAIN_SPACES_URL;
  private readonly bucketName = 'blinkly';

  constructor(
    @InjectRepository(QrCode)
    private readonly qrCodeRepository: Repository<QrCode>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
  ) {
    this.s3Client = new S3Client({
      endpoint: process.env.DIGITAL_OCAIN_SPACES_URL || '',
      region: 'fra1',
      credentials: {
        accessKeyId: process.env.DIGITAL_OCAIN_SPACES_ACCESS_KEY || '',
        secretAccessKey: process.env.DIGITAL_OCAIN_SPACES_SECRET_KEY || '',
      },
    });
  }

  async createQrCode(
    userId: string,
    createQrDto: CreateQrCodeDto,
  ): Promise<QrCode> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['activeSubscription', 'activeSubscription.plan'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Validate against subscription limits
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const qrCount = await this.qrCodeRepository.count({
      where: {
        user: { id: userId },
        createdAt: MoreThan(currentMonthStart),
      },
    });

    const qrLimit = user.activeSubscription?.plan?.qrCodesLimit;
    if (qrLimit !== null && qrCount >= qrLimit) {
      throw new BadRequestException(
        `You have reached your monthly limit of ${qrLimit} QR codes`,
      );
    }

    // If linkId is provided, verify the link exists and belongs to the user
    let link: Link | null = null;
    if (createQrDto.linkId) {
      link = await this.linkRepository.findOne({
        where: { id: createQrDto.linkId, user: { id: userId } },
      });
      if (!link) {
        throw new BadRequestException(
          'Link not found or does not belong to user',
        );
      }
    }

    try {
      // Generate QR code
      const qrBuffer = await QRCode.toBuffer(createQrDto.targetUrl, {
        type: 'png' as const,
        color: {
          dark: createQrDto.color || '#000000',
          light: createQrDto.backgroundColor || '#FFFFFF',
        },
        width: createQrDto.size || 300,
        margin: 1,
        errorCorrectionLevel: 'H',
      });

      let finalBuffer = qrBuffer;

      // If logo URL is provided, overlay it on the QR code
      if (createQrDto.logoUrl) {
        const logoResponse = await fetch(createQrDto.logoUrl);
        const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

        // Calculate logo size (25% of QR code size)
        const logoSize = Math.round((createQrDto.size || 300) * 0.25);

        // Resize and center the logo
        const resizedLogo = await sharp(logoBuffer)
          .resize(logoSize, logoSize)
          .toBuffer();

        // Calculate position to center the logo
        const position = Math.round(((createQrDto.size || 300) - logoSize) / 2);

        // Composite the logo onto the QR code
        finalBuffer = await sharp(qrBuffer)
          .composite([
            {
              input: resizedLogo,
              top: position,
              left: position,
            },
          ])
          .toBuffer();
      }

      // Generate unique filename
      const filename = `qr-codes/${userId}/${Date.now()}.png`;

      // Upload to DigitalOcean Spaces
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: filename,
          Body: finalBuffer,
          ContentType: 'image/png',
          ACL: 'public-read',
        }),
      );

      // Create QR code record
      const qrCode = this.qrCodeRepository.create({
        ...createQrDto,
        user,
        ...(link ? { link } : {}),
        imageUrl: `${this.spacesEndpoint}/${filename}`,
      });

      return await this.qrCodeRepository.save(qrCode);
    } catch (error) {
      this.logger.error(`Failed to create QR code: ${error.message}`);
      throw error;
    }
  }

  async findAll(userId: string): Promise<QrCode[]> {
    return this.qrCodeRepository.find({
      where: { user: { id: userId } },
      relations: ['link'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<QrCode> {
    const qrCode = await this.qrCodeRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['link'],
    });

    if (!qrCode) {
      throw new BadRequestException('QR code not found');
    }

    return qrCode;
  }

  async remove(userId: string, id: string): Promise<void> {
    const qrCode = await this.qrCodeRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!qrCode) {
      throw new BadRequestException('QR code not found');
    }

    await this.qrCodeRepository.remove(qrCode);
  }
}
