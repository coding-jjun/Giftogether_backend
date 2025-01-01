import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * waitForEventJobs 함수는 특정 이벤트가 발생할 때까지 기다릴 수 있도록 비동기 처리를 지원하는 함수입니다.
 * 이 함수는 EventEmitter2를 사용하여 이벤트 리스너를 등록하고, 해당 이벤트가 발생하면 프로미스를 반환하여
 * 이후 로직이 실행될 수 있도록 합니다.
 *
 * 이 함수는 주로 테스트나 특정 로직에서 이벤트를 기다려야 할 때 사용할 수 있습니다. waitForEventJobs는
 * 지정된 이벤트가 한 번 발생할 때까지 대기하며, 이벤트가 발생하면 즉시 Promise를 resolve하여 이후의
 * 작업이 진행되도록 합니다.
 */
export const waitForEventJobs = (emitter: EventEmitter2, event) => {
  return new Promise<void>((resolve) => {
    emitter.once(event, async () => {
      await Promise.resolve();
      resolve();
    });
  });
};
