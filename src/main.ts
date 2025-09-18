import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuration des cookies
  app.use(cookieParser());
  
  // Configuration globale de validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Supprime les propriétés non définies dans le DTO
    forbidNonWhitelisted: true, // Lance une erreur si des propriétés non autorisées sont présentes
    transform: true, // Transforme automatiquement les types
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Filtre d'exception global
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configuration CORS pour le frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('Shabaka API')
    .setDescription(`
      # Welcome to Shabaka API! 🚀
      
      A community-based learning platform API. Most endpoints require authentication using JWT tokens.
      
      **Get started:** Use \`/auth/login\` to authenticate and get your access token.
    `)
    .setVersion('1.0.0')
    .addServer('http://localhost:3000', 'Development Server')
    .addServer('https://api.shabaka.com', 'Production Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Users', 'User management and profile operations')
    .addTag('Communities', 'Community creation, management, and joining')
    .addTag('Courses (Creator)', 'Course creation and management - Content creator functions only')
    .addTag('Course Enrollment (User)', 'Course enrollment and progress tracking - User functions')
    .addTag('Upload', 'File upload and management')
    .addTag('Admin', 'Administrative operations and management')
    .addTag('Resources', 'Resource management and organization')
    .addTag('Sessions', 'User session management')
    .addTag('Challenges', 'Community challenges and competitions')
    .addTag('Products', 'Product management within communities')
    .addTag('Events', 'Event creation and management')
    .addTag('Posts', 'Community posts and social features')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  // Custom Swagger UI configuration
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      tryItOutEnabled: true
    },
    customSiteTitle: 'Shabaka API',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #2c3e50; }
    `
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Application démarrée sur le port ${port}`);
  console.log(`📚 Documentation API: http://localhost:${port}/api/docs`);
  console.log(`🔗 API Base URL: http://localhost:${port}`);
}
bootstrap();
