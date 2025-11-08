import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { nameParsePresentation } from './package-json.helper';

export const configSwagger = (app: INestApplication, packageJson: any) => {
  const config = new DocumentBuilder()
    .setTitle(nameParsePresentation(packageJson.name))
    .setVersion(packageJson.version)
    .setDescription(packageJson.description)
    .setContact(packageJson.contact?.name || packageJson.author, '', packageJson.contact?.email || '')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: nameParsePresentation(packageJson.name),
    customCss: `
         .swagger-ui .topbar { display: none; }
         .swagger-ui .info { margin: 20px 0;}
         .swagger-ui .info hgroup.main { margin: 0 0 0;}
         .title span { display: block; }
    `,
  });
};
