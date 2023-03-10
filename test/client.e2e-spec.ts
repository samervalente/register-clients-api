import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

import { HttpStatus, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { makeClient, makeManyClients } from './factories/client.factory';

const prisma = new PrismaClient();

describe('Tests for /clients (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE clients`;
  });

  it(`/POST clients should be able to create a valid client`, () => {
    const mockClient = makeClient();

    return request(app.getHttpServer())
      .post('/clients')
      .send(mockClient)
      .expect(HttpStatus.CREATED)
      .expect((response: request.Response) => {
        expect((response.body.response = 'Client registered sucessfully'));
        expect(response.body.client.props === mockClient);
      });
  });

  it(`/POST clients should not be able to create a client with existing CPF`, async () => {
    const mockClient = makeClient();
    await request(app.getHttpServer()).post('/clients').send(mockClient);

    return request(app.getHttpServer())
      .post('/clients')
      .send(mockClient)
      .expect(HttpStatus.CONFLICT);
  });

  it(`/POST clients should not be able to create a client with invalid CPF`, async () => {
    const mockClient = makeClient({ cpf: '065.035.742-30' });

    return request(app.getHttpServer())
      .post('/clients')
      .send(mockClient)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it(`/GET clients should be able to return all clients`, async () => {
    const mockClients = makeManyClients();

    await prisma.client.createMany({
      data: mockClients,
    });

    return request(app.getHttpServer())
      .get('/clients')
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(12);
      });
  });

  it(`/GET clients should be able to make pagination`, async () => {
    const mockClients = makeManyClients(10);

    await prisma.client.createMany({
      data: mockClients,
    });

    return request(app.getHttpServer())
      .get('/clients?page=2&limit=5')
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).not.toBeNull();
        expect(response.body).toHaveLength(5);
      });
  });

  it(`/GET clients/:cpf should be able to return a correct client`, async () => {
    const mockClients = makeManyClients(5);
    const targetClient = mockClients[3];
    const { cpf, name } = targetClient;

    await prisma.client.createMany({
      data: mockClients,
    });

    return request(app.getHttpServer())
      .get(`/clients/${cpf}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        expect(response.body).toBeInstanceOf(Object);
        expect(response.body).not.toBeNull();
        expect(response.body.cpf === cpf);
        expect(response.body.name === name);
      });
  });

  it(`/GET clients/:cpf should not be able to return a client with non existing CPF`, async () => {
    const mockClients = makeManyClients(5);
    const nonExistingCPF = '065.035.742-66';

    await prisma.client.createMany({
      data: mockClients,
    });

    return request(app.getHttpServer())
      .get(`/clients/${nonExistingCPF}`)
      .expect(HttpStatus.NOT_FOUND);
  });

  afterAll(async () => {
    await app.close();
  });
});
