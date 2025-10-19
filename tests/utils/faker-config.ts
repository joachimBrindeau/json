import { faker } from '@faker-js/faker';
import jsf from 'json-schema-faker';

export const TEST_SEED = 12345;

export function initializeFaker(seed: number = TEST_SEED) {
  faker.seed(seed);
  jsf.option({
    random: () => {
      // Use seeded random from faker
      return faker.number.float({ min: 0, max: 1 });
    },
  });
}

export { faker };