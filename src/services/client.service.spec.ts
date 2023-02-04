import { InMemoryClientRepository } from '../../test/repositories/in-memory-client.repository';
import { ClientService } from './client.service';
import { makeClient } from '../../test/factories/client.factory';

import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

describe('Tests for create clients service', () => {
  it('should able to create a client', async () => {
    const clientRepository = new InMemoryClientRepository();
    const clientService = new ClientService(clientRepository);

    const createdClient = await clientService.create({
      name: 'Samer Valente',
      cpf: '06503574266',
      birthDate: '02/05/2003',
    });

    expect(clientRepository.clients).toHaveLength(1);
    expect(clientRepository.clients[0]).toEqual(createdClient);
  });

  it('should not be able to create a client with invalid CPF', async () => {
    const clientRepository = new InMemoryClientRepository();
    const clientService = new ClientService(clientRepository);
    const invalidCPF = '06503574238';

    expect(
      async () =>
        await clientService.create({
          name: 'Samer Valente',
          cpf: invalidCPF,
          birthDate: '02/05/2003',
        }),
    ).rejects.toThrow(UnprocessableEntityException);
    expect(clientRepository.clients).toHaveLength(0);
  });

  it('should not be able to create a client with existing CPF', async () => {
    const clientRepository = new InMemoryClientRepository();
    const clientService = new ClientService(clientRepository);

    await clientService.create({
      name: 'Samer Valente',
      cpf: '06503574266',
      birthDate: '02/05/2003',
    });

    expect(
      async () =>
        await clientService.create({
          name: 'Filipe Valente',
          cpf: '06503574266',
          birthDate: '19/10/1999',
        }),
    ).rejects.toThrow(ConflictException);
    expect(clientRepository.clients).toHaveLength(1);
  });
});

describe('Tests for get client by CPF service', () => {
  it('should be able to get a client with valid CPF', async () => {
    const clientRepository = new InMemoryClientRepository();
    const clientService = new ClientService(clientRepository);

    const createdClient = await clientService.create({
      name: 'Samer Valente',
      cpf: '06503574266',
      birthDate: '02/05/2003',
    });

    const foundClient = await clientService.getByCPF('065.035.742-66');
    expect(foundClient).toEqual(createdClient);
  });

  it('should not be able to get a client with non existing CPF', async () => {
    const clientRepository = new InMemoryClientRepository();
    const clientService = new ClientService(clientRepository);

    expect(
      async () => await clientService.getByCPF('123.456.789-10'),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('Tests for get all clients services', () => {
  it('should be able to get all clients', async () => {
    const clientRepository = new InMemoryClientRepository();
    const clientService = new ClientService(clientRepository);
    const validsCPF = ['971.276.840-65', '930.152.740-58', '589.229.820-55'];

    for (let i = 0; i < 3; i++) {
      const client = makeClient({ cpf: validsCPF[i] });
      await clientService.create(client);
    }

    const allClients = await clientService.getAll();

    expect(allClients).toHaveLength(3);
    expect(allClients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Samer Valente',
          cpf: '971.276.840-65',
        }),
      ]),
    );
  });

  it('should be able to make pagination', async () => {
    const clientRepository = new InMemoryClientRepository();
    const clientService = new ClientService(clientRepository);
    const validsCPF = [
      '971.276.840-65',
      '930.152.740-58',
      '589.229.820-55',
      '571.847.180-03',
      '964.202.180-39',
      '064.706.150-31',
    ];

    for (let i = 0; i < 6; i++) {
      const client = makeClient({ cpf: validsCPF[i] });
      await clientService.create(client);
    }

    const allClients = await clientService.getAll(2, 3);

    expect(allClients).toHaveLength(3);
    expect(allClients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ cpf: '571.847.180-03' }),
        expect.objectContaining({ cpf: '964.202.180-39' }),
        expect.objectContaining({ cpf: '064.706.150-31' }),
      ]),
    );
  });
});
