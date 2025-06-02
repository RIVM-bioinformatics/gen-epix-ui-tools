#!/usr/bin/env node

import { join } from 'path';

import { OAuth2Server } from 'oauth2-mock-server';
import basicAuth from 'basic-auth';

import { findGitRootPath } from '@gen-epix/tools-lib';
import { existsSync, readFileSync } from 'fs';

type Config = {
  user: {
    email: string;
    sub: string;
    first_name: string;
    last_name: string;
  }
  port: number;
  token_time_out_seconds: number;
  scope: string;
}

const DEFAULT_PORT = 5443;
const DEFAULT_TOKEN_TIME_OUT_SECONDS = 3600;
const DEFAULT_SCOPE = 'openid profile email offline_access';

const configFilePath = join(findGitRootPath(), 'oidc-mock-server.config.json');
const keyPemPath = join(findGitRootPath(), 'cert', 'key.pem');
const certPemPath = join(findGitRootPath(), 'cert', 'cert.pem');


if (!existsSync(configFilePath)) {
  console.error(`Configuration file not found at: ${configFilePath}`);
  process.exit(1);
}
console.log(`Using configuration file: ${configFilePath}`);

if (!existsSync(keyPemPath)) {
  console.error(`Key PEM file not found at: ${keyPemPath}`);
  process.exit(1);
}
if (!existsSync(certPemPath)) {
  console.error(`Certificate PEM file not found at: ${certPemPath}`);
  process.exit(1);
}

const config = JSON.parse(readFileSync(configFilePath, 'utf-8')) as Config;

if (!config.user || !config.user.email || !config.user.sub || !config.user.first_name || !config.user.last_name) {
  console.error('Invalid configuration: user, email, and sub are required.');
  process.exit(1);
}

if (!config.port) {
  console.warn(`Port not specified, using default port ${DEFAULT_PORT}.`);
}
if (!config.token_time_out_seconds) {
  console.warn(`Token timeout not specified, using default timeout ${DEFAULT_TOKEN_TIME_OUT_SECONDS} seconds.`);
}
if (!config.scope) {
  console.warn(`Scope not specified, using default scope "${DEFAULT_SCOPE}".`);
}


const USER = config.user;
const PORT = config.port ?? DEFAULT_PORT;
const TOKEN_TIME_OUT_SECONDS = config.token_time_out_seconds ?? DEFAULT_TOKEN_TIME_OUT_SECONDS;
const SCOPE = config.scope ?? DEFAULT_SCOPE;

const server = new OAuth2Server(
  keyPemPath,
  certPemPath,
);

interface Request {
  headers?: {
    authorization?: string | undefined;
  };
  body?: {
    [key: string]: string;
  };
}

interface Token {
  payload?: {
    [key: string]: string | number;
  };
}

interface Response {
  body?: {
    [key: string]: string | number | boolean;
  };
  statusCode?: number;
}

const exp = () => {
  const timestamp = Math.floor(Date.now() / 1000);
  return timestamp + TOKEN_TIME_OUT_SECONDS;
};

const start = async () => {
  // Generate a new RSA key and add it to the keystore
  await server.issuer.keys.add({
    kty: 'RSA',
    use: 'sig',
    alg: 'RS256',
    kid: 'd391d514-f82b-410e-b2bc-17c021b77e28',
    d: 'bEjBkAZf2SOKXVG7zwcuPsLb0k9cHIqddi_RgylWnsDcI2XG53HiOSMKpQ_sKjF1g4nUg9CvciC0-KYKE9UNmIzE6VY-I5DgbF5YIz_YVYOtNxZi7R66a_nAzeZfoxnjSNlfQFrbSqzTOU3EFw4irIjvSxAS8x4a79O3bw48j4C5Bk5PRnFq5AVkaLcS5_zd1DsHjvVn0PSvlKWwCU3PIkZu-OXleO2GHG6FIzzoKyGEl5LrRRygWcZzXUWDyMFpwKHnCHw32pFA_BGz1X2Cv7j4ajQjHItR3OgGncHWVVZIACFjqsm2q-a1NTJQWb6_smKRau2fM5elAR68rvsWmQ',
    n: '606TR4ffMmg3NyqlgyC7vqYsO_Rok1jL7kmGA4nSyrbYtaq2L-6P5zDZPA9Sya4NEEQ_KtEhK73il0VY8sJg1Ohjq8nXBELjWG36syelQRAxhwmmv9VrJ4PFbW7pzGu4amGq8chuqsT_JM4tP_YrDv7enYV2XPTSQXe4yhIcYgIBwFYHP_XAb54sYns4q4vyMrH2MS4vfwhtaJ7s-5GsApU5kL-LpwklRxb1UE2tjh7pdRLwilSVhukOYz0Z9zZ2IXQ1xhn-6tQ-IRcJiVE0knWAXF28lpNLknnzdOF4NCCRohpHkA9Sc3ZhVRIbkG75SNFgSqXpl49JuxmmkLkqTw',
    e: 'AQAB',
    p: '9HHKBHUOyRhGo1Uf_v6ueGt-LUvM_um_XTrz0Pm8iQRKF3nQnpvKeWrRyMhbS1oUPtHc_GfwbmN1FzCmDzNN1M27jSALOTo57ewRoT8_NuqbRGsoaPrhLyCiQ-nm45OQS9wXgRSmHM-Nq2ZpGoFGciPIVWxBJRgZzIjUB5SsnFU',
    q: '9m40oqwz1XO1JCROAxyVCaeeTF0VJQTaGVfNYSlqP2uKyyyy00iFrzsN4EPru9kvYYj-kYq9RKHP6y4z2vK4Yvik8XVZdVLzMKlj9-bqPOZ9iCHTKimMn4URzzklt7MWobc6tO06W8PDN3txhQkWmvJkQFuqDoxjU9FUKcnTUBM',
    dp: 'DbUPyf4ybQ5ib6hHWgo4CGKmua2FeknrRDQZFf_bFafa68QV8b70tKhLyUGK9QfBGOC1zqWZcuc62qkMts9-rs82lCxW1MeyFehl-K_OQKsZN9X2dySSWg0vbDWCkAJnVgmqe7-HrRfqbtEYVbcoFyBwjHG8mXLnh3OoyCALKd0',
    dq: 'kJvXM2aN_EIsGAtd5CGPq9y63eD5mYGhYqHNmait-o1nIxcV0TqLiGrFF8eDu_YVAc1cZZfevTmfQ0kXkPJCFYIHeNH-LwUARJwCV-Ufq6EuJQaEXgeHx8xUyR-l7IihTUCyqJ1VU6grFJHR6dmNdFutTL79qg_j8bmzA9q1sBU',
    qi: 'WQ4ACd_4BiOLQ55Bc6GuAKNZk9VAaDw_4URzhL9kLI3vXm_3NvfpL5Locj7F3tq8WUhRvSCg0KPL1RHjYQaqqk7bwgZ1Tr1QWiRZeycR-gdzb3Oqbcxr3YgnJKhah5feWj2YlvQFiqNQdr1ZAA3FMy05MYepaTwT58hrYYExIFo',
  });

  server.service.on('beforeResponse', (tokenEndpointResponse: Response) => {
    console.log('Serving token');
    tokenEndpointResponse.body.expires_in = TOKEN_TIME_OUT_SECONDS;
    tokenEndpointResponse.body.scope = SCOPE;
  });

  server.service.on('beforeTokenSigning', (token: Token, req: Request) => {
    console.log('Before token signing');
    const credentials = basicAuth(req);
    const clientId = credentials ? credentials.name : req.body.client_id;

    token.payload.aud = clientId;
    token.payload.exp = exp();
    token.payload.scope = SCOPE;
    const userCopy = { ...USER };
    delete userCopy.email;
    Object.assign(token.payload, userCopy);
  });

  server.service.on('beforeUserinfo', (userInfoResponse: Response) => {
    console.log('Serving userinfo');
    userInfoResponse.body = USER;
    userInfoResponse.statusCode = 200;
  });

  server.service.on('beforeIntrospect', (introspectResponse: Response) => {
    console.log('Serving introspect');
    introspectResponse.body = {
      active: true,
      scope: 'openid profile email offline_access',
      client_id: 'lsp_client_id',
      exp: exp(),
    };
  });

  // Start the server
  await server.start(PORT, '127.0.0.1');
}
start().then(() => {
  console.log(`OIDC mock server started and listening on port ${PORT}, check https://localhost:5443/.well-known/openid-configuration`);
}).catch((err) => {
  console.error('Error starting OIDC mock server:', err);
  process.exit(1);
});
