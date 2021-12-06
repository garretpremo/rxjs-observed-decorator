import { SchedulerLike } from "rxjs";

export type ObservedDecoratorType = 'behavior' | 'subject' | 'replay';

export interface ObservedDecoratorOptions {
    type: ObservedDecoratorType;
    replayOptions?: {
        bufferSize?: number;
        windowTime?: number;
        scheduler?: SchedulerLike;
    };
}
