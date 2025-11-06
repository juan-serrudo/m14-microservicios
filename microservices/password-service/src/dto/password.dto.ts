import { IsNotEmpty, IsString, MaxLength, MinLength, IsOptional, IsUrl } from 'class-validator';

export class CreatePasswordDto {
  @IsString()
  @MaxLength(200)
  @MinLength(1)
  @IsNotEmpty()
  title: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @IsString()
  @MaxLength(200)
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  @IsUrl({}, { message: 'URL debe ser válida' })
  url?: string;

  @IsString()
  @MaxLength(200)
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsNotEmpty()
  masterKey: string;
}

export class UpdatePasswordDto {
  @IsString()
  @MaxLength(200)
  @MinLength(1)
  @IsOptional()
  title?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  @IsUrl({}, { message: 'URL debe ser válida' })
  url?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsNotEmpty()
  masterKey: string;
}

export class DecryptPasswordDto {
  @IsString()
  @IsNotEmpty()
  masterKey: string;
}

