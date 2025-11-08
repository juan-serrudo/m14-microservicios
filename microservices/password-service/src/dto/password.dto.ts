import { IsNotEmpty, IsString, MaxLength, MinLength, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePasswordDto {
  @ApiProperty({
    description: 'Título de la entrada',
    example: 'Gmail Personal',
    required: true,
  })
  @IsString()
  @MaxLength(200)
  @MinLength(1)
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Descripción de la entrada',
    example: 'Cuenta principal de Gmail',
    required: false,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Nombre de usuario o email',
    example: 'usuario@gmail.com',
    required: true,
  })
  @IsString()
  @MaxLength(200)
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Contraseña a almacenar',
    example: 'miContraseñaSegura123!',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'URL del sitio web',
    example: 'https://gmail.com',
    required: false,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  @IsUrl({}, { message: 'URL debe ser válida' })
  url?: string;

  @ApiProperty({
    description: 'Categoría de la entrada',
    example: 'Redes Sociales',
    required: true,
  })
  @IsString()
  @MaxLength(200)
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Notas adicionales',
    example: 'Cuenta creada en 2020',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Clave maestra para cifrar/descifrar',
    example: 'miClaveMaestraSegura123!',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  masterKey: string;
}

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'Título de la entrada',
    example: 'Gmail Personal',
    required: false,
  })
  @IsString()
  @MaxLength(200)
  @MinLength(1)
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Descripción de la entrada',
    example: 'Cuenta principal de Gmail',
    required: false,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Nombre de usuario o email',
    example: 'usuario@gmail.com',
    required: false,
  })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  username?: string;

  @ApiProperty({
    description: 'Contraseña a almacenar',
    example: 'miContraseñaSegura123!',
    required: false,
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'URL del sitio web',
    example: 'https://gmail.com',
    required: false,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  @IsUrl({}, { message: 'URL debe ser válida' })
  url?: string;

  @ApiProperty({
    description: 'Categoría de la entrada',
    example: 'Redes Sociales',
    required: false,
  })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Notas adicionales',
    example: 'Cuenta creada en 2020',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Clave maestra para cifrar/descifrar',
    example: 'miClaveMaestraSegura123!',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  masterKey: string;
}

export class DecryptPasswordDto {
  @ApiProperty({
    description: 'Clave maestra para descifrar la contraseña',
    example: 'miClaveMaestraSegura123!',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  masterKey: string;
}

