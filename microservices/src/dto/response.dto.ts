import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class ResponseDTO {
  @Expose()
  @IsBoolean()
  @ApiProperty({ description: 'Columna a ordernar', required: true })
  error: boolean;

  @Expose()
  @IsString()
  @ApiProperty({ description: 'Mensaje general del endpoint', required: false })
  message: string;

  @Expose()
  @ApiProperty({ description: 'Contenido del mensaje', required: false })
  response: any;

  @Expose()
  @IsNumber()
  @ApiProperty({ description: 'El código del error', required: false })
  status: number;
}