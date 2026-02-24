import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Response<T> {
    Success: boolean;
    Message: string;
    Object: T | null;
    Errors: string[] | null;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        return next.handle().pipe(
            map((data) => {
                // Handle paginated responses if they have a specific structure
                if (data && data.meta && data.data) {
                    return {
                        Success: true,
                        Message: 'Operation successful',
                        Object: data.data,
                        PageNumber: data.meta.page,
                        PageSize: data.meta.limit,
                        TotalSize: data.meta.total,
                        Errors: null,
                    } as any;
                }

                return {
                    Success: true,
                    Message: 'Operation successful',
                    Object: data,
                    Errors: null,
                };
            }),
            catchError((err) => {
                const status =
                    err instanceof HttpException
                        ? err.getStatus()
                        : HttpStatus.INTERNAL_SERVER_ERROR;

                let message = 'An error occurred';
                let errors: string[] | null = null;

                if (err instanceof HttpException) {
                    const response = err.getResponse();
                    if (typeof response === 'object' && response['message']) {
                        errors = Array.isArray(response['message']) ? response['message'] : [response['message']];
                        message = errors[0];
                    } else {
                        message = err.message;
                        errors = [err.message];
                    }
                } else {
                    errors = [err.message || 'Internal server error'];
                }

                return throwError(
                    () =>
                        new HttpException(
                            {
                                Success: false,
                                Message: message,
                                Object: null,
                                Errors: errors,
                            },
                            status,
                        ),
                );
            }),
        );
    }
}
