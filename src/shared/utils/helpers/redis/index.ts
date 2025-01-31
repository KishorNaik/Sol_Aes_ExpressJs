import { REDIS_DB, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from '@/config';
import { createClient, RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis';
import { logger } from '../loggers';
import { Ok, Result } from 'neverthrow';
import { ResultError, ResultExceptionFactory } from '../../exceptions/results';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class RedisHelper {
	//private client: RedisClientType;
	private client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
	private isConnected: boolean = false;

	async init(isLocal: boolean = false) {
		if (isLocal) {
			logger.info(`$Host:${REDIS_HOST}:Port:${REDIS_PORT}`);

			this.client = await createClient()
				.on('error', (err) => {
					this.isConnected = false;
					console.log('Redis Client Error', err);
					logger.error(`Redis Client Error: ${err}`);
				})
				.on('ready', () => {
					this.isConnected = true;
					console.log('Redis Client Ready');
					logger.info('Redis Client Ready');
				})
				.on('end', () => {
					this.isConnected = false;
					console.log('Redis Client End');
					logger.info('Redis Client End');
				})
				.connect();
		} else {
			const url: string = `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`;

			this.client = await createClient({
				url: url,
			})
				.on('error', (err) => {
					this.isConnected = false;
					console.log('Redis Client Error', err);
					logger.error(`Redis Client Error: ${err}`);
				})
				.on('ready', () => {
					this.isConnected = true;
					console.log('Redis Client Ready');
					logger.info('Redis Client Ready');
				})
				.on('end', () => {
					this.isConnected = false;
					console.log('Redis Client End');
					logger.info('Redis Client End');
				})
				.connect();
		}
	}

	async get(key: string): Promise<Result<string | null | undefined, ResultError>> {
		if (!this.isConnected)
			return ResultExceptionFactory.error(
				StatusCodes.SERVICE_UNAVAILABLE,
				'Redis Client Not Connected'
			);

		if (!key) return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Key is required');
		const data = await this.client.get(key);
		return new Ok(data);
	}

	async set(key: string, value: string): Promise<Result<undefined, ResultError>> {
		if (!this.isConnected)
			return ResultExceptionFactory.error(
				StatusCodes.SERVICE_UNAVAILABLE,
				'Redis Client Not Connected'
			);
		if (!key) return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Key is required');
		if (!value)
			return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Value is required');

		await this.client.set(key, value);
		return new Ok(undefined);
	}

	async disconnect(): Promise<void> {
		if (this.isConnected) {
			await this.client.disconnect();
			this.isConnected = false;
		}
	}
}
