import { IsArray, IsEnum, IsUrl } from 'class-validator';
import { WebhookEventType } from '../../entities/webhook-endpoint.entity';

export class CreateWebhookDto {
  @IsUrl()
  url: string;

  @IsArray()
  @IsEnum(WebhookEventType, { each: true })
  events: WebhookEventType[];
}
