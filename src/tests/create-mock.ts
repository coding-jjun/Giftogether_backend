export function createMock<T>(cls: new (...args: any[]) => T): jest.Mocked<T> {
  const mock: Partial<jest.Mocked<T>> = {};

  Object.entries(Object.getOwnPropertyDescriptors(cls.prototype)).forEach(
    ([key, descriptor]) => {
      if (typeof descriptor.value === 'function' && key !== 'constructor') {
        mock[key] = jest.fn();
      }
    },
  );

  return mock as jest.Mocked<T>;
}
