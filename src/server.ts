import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import cors from 'cors';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvers } from './resolvers';
import typeDefs from './typeDefs';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { db } from './db';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

const apolloServer = new ApolloServer<{}>({
  typeDefs,
  resolvers,
  plugins:
    process.env['NODE_ENV'] === 'production'
      ? [ApolloServerPluginLandingPageDisabled()]
      : undefined,
});

await apolloServer.start();

app.use(
  '/graphql',
  cors<cors.CorsRequest>(),
  express.json(),
  expressMiddleware(apolloServer)
);

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next()
    )
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] ?? 4200;
  const httpServer = app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });

  const shutdownServer = (signal: NodeJS.Signals) => {
    console.log(`Received ${signal} signal. Shutting down...`);
    httpServer.close(() => {
      console.log('Server shut down.');
    });
    db.destroy().then(() => {
      console.log('Disconnected from database.');
    });
  };

  process.on('SIGINT', shutdownServer);
  process.on('SIGTERM', shutdownServer);
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
