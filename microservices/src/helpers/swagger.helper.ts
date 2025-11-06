import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { nameParsePresentation } from './package-json.helper';

export const configSwagger = (app: INestApplication, packageJson: any) => {
  const config = new DocumentBuilder()
    .setTitle(nameParsePresentation(packageJson.name))
    .setVersion(packageJson.version)
    .setDescription(packageJson.description)
    .setContact(packageJson.contact.name, '', packageJson.contact.email)
    // .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: nameParsePresentation(packageJson.name),
    customfavIcon: '../assets/images/favicon.ico',
    customCss: `
         .swagger-ui .topbar { display: none; }
         .swagger-ui .info { margin: 20px 0;}
         .swagger-ui .info hgroup.main { margin: 0 0 0;}
         .title span { display: block; }
    `,
  });
};

export const SWAGGER_GET = (tag: string, permission: string) => {
  return {
    summary: `servicio GET para obtener una ${tag} por ID`,
    description: `servicio GET para obtener una <i><b>${tag}</b></i> por ID
    permisos requeridos:
    <ul>
    <li><b>${permission}</b></li>
    </ul>
    `,
  };
};

export const SWAGGER_GET_LIST = (tag: string, permission: string) => {
  return {
    summary: `servicio GET para obtener todas ${tag}s`,
    description: `servicio GET para obtener listado de <i><b>${tag}s</b></i>
        permisos requeridos:
        <ul>
        <li><b>${permission}</b></li>
        </ul>
        `,
  };
};
export const SWAGGER_POST = (tag: string, permission: string) => {
  return {
    summary: `servicio POST para registra una ${tag}`,
    description: `servicio POST para registra <i><b>${tag}</b></i>
    permisos requeridos:
    <ul>
      <li><b>${permission}</b></li>
    </ul>
    `,
  };
};

export const SWAGGER_PUT = (tag: string, permission: string) => {
  return {
    summary: `servicio PUT para actualizar ${tag}`,
    description: `servicio PUT para actualizar,
    permisos requeridos:
    <ul>
      <li><b>${permission}</b></li>
    </ul>
    `,
  };
};

export const SWAGGER_PATCH = (tag: string, permission: string) => {
  return {
    summary: `servicio PATCH para cambiar e estado de la ${tag}`,
    description: `servicio PATCH para cambiar e estado <i><b>${tag}</b></i>
    permisos requeridos:
    <ul>
      <li><b>${permission}</b></li>
    </ul>
    `,
  };
};

export const SWAGGER_DELETE = (tag: string, permission: string) => {
  return {
    summary: `servicio DELETE para eliminar una ${tag}`,
    description: `servicio DELETE para eliminar una <i><b>${tag}</b></i> por ID
    permisos requeridos:
    <ul>
      <li><b>${permission}</b></li>
    </ul>
    `,
  };
};

export const SWAGGER_POST_REPORTE = (tag: string, permission: string) => {
  return {
    summary: `servicio POST para obtener reporte`,
    description: `servicio POST para obtener reporte <i><b>${tag}</b></i>
    permisos requeridos:
    <ul>
      <li><b>${permission}</b></li>
    </ul>
    `,
  };
};
