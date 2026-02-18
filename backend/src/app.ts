import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/config';

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
    // Placeholder for future routes
    this.app.get('/', (req: Request, res: Response) => {
      res.json({ message: 'Welcome to the Restaurant Management API' });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(
      (err: any, req: Request, res: Response, _next: NextFunction) => {
        const status = (err as any).status || 500;
        const message = err.message || 'Something went wrong';
        res.status(status).json({
          status,
          message,
        });
      },
    );
  }

  public listen(): void {
    this.app.listen(config.port, () => {
      console.log(`=================================`);
      console.log(`🚀 App listening on http://localhost:${config.port}`);
      console.log(`=================================`);
    });
  }
}

export default App;
