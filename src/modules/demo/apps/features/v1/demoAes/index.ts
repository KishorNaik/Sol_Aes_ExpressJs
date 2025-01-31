import { StatusCodes } from 'http-status-codes';
import { Body, Get, HttpCode, JsonController, OnUndefined, Post, Res } from 'routing-controllers';
import { Response } from 'express';
import { OpenAPI } from 'routing-controllers-openapi';
import { AesRequestDto } from '@/shared/models/request/aes.RequestDto';
import { RequestData, RequestHandler, requestHandler } from 'mediatr-ts';
import {
	DataResponse as ApiDataResponse,
	DataResponse,
	DataResponseFactory,
} from '@/shared/models/response/data.Response';
import { AesResponseDto } from '@/shared/models/response/aes.ResponseDto';
import { sealed } from '@/shared/utils/decorators/sealed';
import { ENCRYPTION_KEY } from '@/config';
import {
	DemoAesRequestDto,
	DemoAesResponseDto,
} from '../../../contracts/v1/demoAes/index.Contract';
import Container from 'typedi';
import mediatR from '@/shared/medaitR/index';
import { AesDemoDecryptService } from './services/decryptRequest';
import { AesDemoValidationService } from './services/validation';
import { AesDemoEncryptResponseService } from './services/encryptResponse';

@JsonController('/api/v1/demo')
@OpenAPI({ tags: ['demo'] })
export class DemoAesController {
	@Post()
	@OpenAPI({ summary: 'demo endpoint', tags: ['demo'] })
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	public async demoEndpoint(@Body() request: AesRequestDto, @Res() res: Response) {
		const response = await mediatR.send<ApiDataResponse<AesResponseDto>>(
			new DemoAesCommand(request)
		);
		return res.status(response.StatusCode).json(response);
	}
}

// #region Command Handler
export class DemoAesCommand extends RequestData<ApiDataResponse<AesResponseDto>> {
	private readonly _request: AesRequestDto;

	constructor(request: AesRequestDto) {
		super();
		this._request = request;
	}

	public get request(): AesRequestDto {
		return this._request;
	}
}

@sealed
@requestHandler(DemoAesCommand)
export class DemoAesCommandHandler
	implements RequestHandler<DemoAesCommand, ApiDataResponse<AesResponseDto>>
{
	private readonly _aesDecryptService: AesDemoDecryptService;
	private readonly _validationService: AesDemoValidationService;
	private readonly _aesEncryptResponseService: AesDemoEncryptResponseService;

	public constructor() {
		this._aesDecryptService = Container.get(AesDemoDecryptService);
		this._validationService = Container.get(AesDemoValidationService);
		this._aesEncryptResponseService = Container.get(AesDemoEncryptResponseService);
	}

	public async handle(value: DemoAesCommand): Promise<ApiDataResponse<AesResponseDto>> {
		try {
			if (!value)
				return DataResponseFactory.error<AesResponseDto>(
					StatusCodes.BAD_REQUEST,
					'Invalid command'
				);

			if (!value.request)
				return DataResponseFactory.error<AesResponseDto>(
					StatusCodes.BAD_REQUEST,
					'Invalid request'
				);

			if (!value.request.body)
				return DataResponseFactory.error<AesResponseDto>(
					StatusCodes.BAD_REQUEST,
					'Invalid request body'
				);

			//Decrypt the request
			const decryptedRequestResult = await this._aesDecryptService.handleAsync({
				data: value.request.body,
				key: ENCRYPTION_KEY,
			});
			if (decryptedRequestResult.isErr())
				return DataResponseFactory.error<AesResponseDto>(
					decryptedRequestResult.error.httpCode,
					decryptedRequestResult.error.message
				);

			const decryptedRequest: DemoAesRequestDto = decryptedRequestResult.value;

			//Validate the request
			const validationResult = await this._validationService.handleAsync({
				dto: decryptedRequest,
				dtoClass: DemoAesRequestDto,
			});
			if (validationResult.isErr())
				return DataResponseFactory.error<AesResponseDto>(
					validationResult.error.httpCode,
					validationResult.error.message
				);

			// Map Response
			const demoAesResponseDto: DemoAesResponseDto = new DemoAesResponseDto();
			demoAesResponseDto.firstName = decryptedRequest.firstName;
			demoAesResponseDto.lastName = decryptedRequest.lastName;

			// Encrypt the response
			const encryptedResponseResult = await this._aesEncryptResponseService.handleAsync({
				data: demoAesResponseDto,
				key: ENCRYPTION_KEY,
			});
			if (encryptedResponseResult.isErr())
				return DataResponseFactory.error<AesResponseDto>(
					encryptedResponseResult.error.httpCode,
					encryptedResponseResult.error.message
				);

			const aesResponseDto: AesResponseDto = encryptedResponseResult.value.aesResponseDto;

			return DataResponseFactory.success<AesResponseDto>(
				StatusCodes.OK,
				aesResponseDto,
				'Success'
			);
		} catch (ex) {
			console.log(ex.message);
			return DataResponseFactory.error<AesResponseDto>(
				StatusCodes.INTERNAL_SERVER_ERROR,
				ex.message
			);
		}
	}
}
// #endregion
