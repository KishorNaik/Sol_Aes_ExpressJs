import { Err, Result } from 'neverthrow';
import { HttpException } from '../http';
import { StatusCodes } from 'http-status-codes';

export class ResultError extends HttpException {}

export class ResultExceptionFactory {
	public static error<T>(statusCode: StatusCodes, message: string): Result<T, ResultError> {
		return new Err(new ResultError(statusCode, message));
	}

	public static errorInstance<T>(resultError: ResultError): Result<T, ResultError> {
		return new Err(resultError);
	}
}
