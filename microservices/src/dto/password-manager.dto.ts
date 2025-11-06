import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class CreatePasswordManagerDto {
  @Expose()
  @IsString({ message: 'El campo "Título" debe ser un texto válido.' })
  @MaxLength(200, { message: 'El campo "Título" no puede tener más de 200 caracteres.' })
  @MinLength(1, { message: 'El campo "Título" debe tener al menos 1 carácter.' })
  @IsNotEmpty({ message: 'El campo "Título" es obligatorio.' })
  @ApiProperty({
    description: 'Título de la entrada',
    example: 'Gmail Personal',
    required: true,
  })
  title: string;

  @Expose()
  @IsString({ message: 'El campo "Descripción" debe ser un texto válido.' })
  @MaxLength(500, { message: 'El campo "Descripción" no puede tener más de 500 caracteres.' })
  @IsOptional()
  @ApiProperty({
    description: 'Descripción de la entrada',
    example: 'Cuenta principal de Gmail',
    required: false,
  })
  description: string;

  @Expose()
  @IsString({ message: 'El campo "Usuario" debe ser un texto válido.' })
  @MaxLength(200, { message: 'El campo "Usuario" no puede tener más de 200 caracteres.' })
  @IsNotEmpty({ message: 'El campo "Usuario" es obligatorio.' })
  @ApiProperty({
    description: 'Nombre de usuario o email',
    example: 'usuario@gmail.com',
    required: true,
  })
  username: string;

  @Expose()
  @IsString({ message: 'El campo "Contraseña" debe ser un texto válido.' })
  @IsNotEmpty({ message: 'El campo "Contraseña" es obligatorio.' })
  @ApiProperty({
    description: 'Contraseña a almacenar',
    example: 'miContraseñaSegura123!',
    required: true,
  })
  password: string;

  @Expose()
  @IsString({ message: 'El campo "URL" debe ser un texto válido.' })
  @MaxLength(500, { message: 'El campo "URL" no puede tener más de 500 caracteres.' })
  @IsOptional()
  @IsUrl({}, { message: 'El campo "URL" debe ser una URL válida.' })
  @ApiProperty({
    description: 'URL del sitio web',
    example: 'https://gmail.com',
    required: false,
  })
  url: string;

  @Expose()
  @IsString({ message: 'El campo "Categoría" debe ser un texto válido.' })
  @MaxLength(200, { message: 'El campo "Categoría" no puede tener más de 200 caracteres.' })
  @IsNotEmpty({ message: 'El campo "Categoría" es obligatorio.' })
  @ApiProperty({
    description: 'Categoría de la entrada',
    example: 'Redes Sociales',
    required: true,
  })
  category: string;

  @Expose()
  @IsString({ message: 'El campo "Notas" debe ser un texto válido.' })
  @IsOptional()
  @ApiProperty({
    description: 'Notas adicionales',
    example: 'Cuenta creada en 2020',
    required: false,
  })
  notes: string;

  @Expose()
  @IsString({ message: 'El campo "Clave Maestra" debe ser un texto válido.' })
  @IsNotEmpty({ message: 'El campo "Clave Maestra" es obligatorio.' })
  @ApiProperty({
    description: 'Clave maestra para cifrar/descifrar',
    example: 'miClaveMaestraSegura123!',
    required: true,
  })
  masterKey: string;
}

export class UpdatePasswordManagerDto {
  @Expose()
  @IsString({ message: 'El campo "Título" debe ser un texto válido.' })
  @MaxLength(200, { message: 'El campo "Título" no puede tener más de 200 caracteres.' })
  @MinLength(1, { message: 'El campo "Título" debe tener al menos 1 carácter.' })
  @IsOptional()
  @ApiProperty({
    description: 'Título de la entrada',
    example: 'Gmail Personal',
    required: false,
  })
  title?: string;

  @Expose()
  @IsString({ message: 'El campo "Descripción" debe ser un texto válido.' })
  @MaxLength(500, { message: 'El campo "Descripción" no puede tener más de 500 caracteres.' })
  @IsOptional()
  @ApiProperty({
    description: 'Descripción de la entrada',
    example: 'Cuenta principal de Gmail',
    required: false,
  })
  description?: string;

  @Expose()
  @IsString({ message: 'El campo "Usuario" debe ser un texto válido.' })
  @MaxLength(200, { message: 'El campo "Usuario" no puede tener más de 200 caracteres.' })
  @IsOptional()
  @ApiProperty({
    description: 'Nombre de usuario o email',
    example: 'usuario@gmail.com',
    required: false,
  })
  username?: string;

  @Expose()
  @IsString({ message: 'El campo "Contraseña" debe ser un texto válido.' })
  @IsOptional()
  @ApiProperty({
    description: 'Contraseña a almacenar',
    example: 'miContraseñaSegura123!',
    required: false,
  })
  password?: string;

  @Expose()
  @IsString({ message: 'El campo "URL" debe ser un texto válido.' })
  @MaxLength(500, { message: 'El campo "URL" no puede tener más de 500 caracteres.' })
  @IsOptional()
  @IsUrl({}, { message: 'El campo "URL" debe ser una URL válida.' })
  @ApiProperty({
    description: 'URL del sitio web',
    example: 'https://gmail.com',
    required: false,
  })
  url?: string;

  @Expose()
  @IsString({ message: 'El campo "Categoría" debe ser un texto válido.' })
  @MaxLength(200, { message: 'El campo "Categoría" no puede tener más de 200 caracteres.' })
  @IsOptional()
  @ApiProperty({
    description: 'Categoría de la entrada',
    example: 'Redes Sociales',
    required: false,
  })
  category?: string;

  @Expose()
  @IsString({ message: 'El campo "Notas" debe ser un texto válido.' })
  @IsOptional()
  @ApiProperty({
    description: 'Notas adicionales',
    example: 'Cuenta creada en 2020',
    required: false,
  })
  notes?: string;

  @Expose()
  @IsString({ message: 'El campo "Clave Maestra" debe ser un texto válido.' })
  @IsNotEmpty({ message: 'El campo "Clave Maestra" es obligatorio.' })
  @ApiProperty({
    description: 'Clave maestra para cifrar/descifrar',
    example: 'miClaveMaestraSegura123!',
    required: true,
  })
  masterKey: string;
}

export class DecryptPasswordDto {
  @Expose()
  @IsString({ message: 'El campo "Clave Maestra" debe ser un texto válido.' })
  @IsNotEmpty({ message: 'El campo "Clave Maestra" es obligatorio.' })
  @ApiProperty({
    description: 'Clave maestra para descifrar la contraseña',
    example: 'miClaveMaestraSegura123!',
    required: true,
  })
  masterKey: string;
}
