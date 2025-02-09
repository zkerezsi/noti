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
import { Server } from 'node:http';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

type MyContext = {};

const apolloServer = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
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

let httpServer: Server;

if (isMainModule(import.meta.url)) {
  httpServer = app.listen(8080, () => {
    console.log(`Node Express server listening on http://localhost:8080`);
  });
}

process.on('SIGINT', () => {
  console.log('Received SIGINT signal. Shutting down...');
  shutdownServer();
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal. Shutting down...');
  shutdownServer();
});

function shutdownServer() {
  httpServer?.close(() => {
    console.log('Server shut down.');
    process.exit(0);
  });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
