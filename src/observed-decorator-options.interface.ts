import { SchedulerLike } from "rxjs";

export interface ObservedDecoratorOptions {
    type: 'behavior' | 'subject' | 'replay';
    replayOptions?: {
        bufferSize?: number;
        windowTime?: number;
        scheduler?: SchedulerLike;
    };
}