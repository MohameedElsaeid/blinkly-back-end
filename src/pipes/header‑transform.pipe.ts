// pipes/header‑transform.pipe.ts
import { Injectable, PipeTransform } from '@nestjs/common';
import { camelCase } from 'lodash';
import { HeaderData } from '../interfaces/headers.interface';

@Injectable()
export class HeaderTransformPipe
  implements PipeTransform<Record<string, string>, HeaderData>
{
  transform(raw: Record<string, string>): HeaderData {
    const out: Partial<HeaderData> = {};

    for (const [key, value] of Object.entries(raw)) {
      const camel = camelCase(key); // x-device-memory -> xDeviceMemory
      let v: any = value === '' ? null : value;

      if (
        [
          'xDeviceMemory',
          'xHardwareConcurrency',
          'xColorDepth',
          'xScreenWidth',
          'xScreenHeight',
        ].includes(camel)
      ) {
        v = v != null ? Number(v) : null;
      }

      (out as any)[camel] = v;
    }

    return out as HeaderData;
  }
}
