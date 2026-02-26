import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './api/routes';
import {
  errorHandler,
  notFoundHandler,
} from './shared/middleware/error-handler';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(morgan('dev'));
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api/v1', routes);

    // Welcome route
    this.app.get('/', (_req, res) => {
      res.json({
        message: 'Welcome to the Restaurant Management API',
        version: '1.0.0',
        documentation: '/api/docs',
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }
}

const appInstance = new App();
export default appInstance.app;
