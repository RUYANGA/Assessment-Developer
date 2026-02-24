import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Eskalate News API')
    .setDescription('Professional backend for Authors to publish content and Readers to consume it.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Global Pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global Interceptors
  app.useGlobalInterceptors(new ResponseInterceptor());

  const port = Number(process.env.PORT) || 3003;
  await app.listen(port, '0.0.0.0');

  const url = await app.getUrl();
  console.log(`Server running at: ${url}`);
  console.log(`Swagger docs available at: ${url}/api/docs`);
}
bootstrap();
//bootstrap();
