import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const configSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Password Service')
    .setVersion('0.0.1')
    .setDescription('Microservicio de gestión de contraseñas con cifrado')
    .setContact('Juan Victor Serrudo Chavez', '', 'juan.serrudo@ucb.edu.bo')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Password Service',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0;}
      .swagger-ui .info hgroup.main { margin: 0 0 0;}
      .title span { display: block; }
    `,
  });
};

