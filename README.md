# Advanced Encryption Standard (AES) Helper Classes
This repository contains helper classes for implementing AES encryption and decryption in an Express.jsTypeScript project.

## Prerequisites
- Node.js
- Express.js
- TypeScript

## Aes Helper Classes and Wrappers
```typescript
import crypto from 'crypto';

import { Service } from 'typedi';
import { Err, Ok, Result } from 'neverthrow';

import { HttpStatusCode } from 'axios';
import { ivLength } from '@/shared/models/constant';
import { IServiceHandlerAsync } from '../services';
import { ResultError } from '../../exceptions/results';
import { AesResponseDto } from '@/shared/models/response/aes.ResponseDto';

export class AES {
	private _ivLength: number = ivLength;
	private readonly _encryptionKey: string;
	constructor(encryptionKey: string) {
		this._encryptionKey = encryptionKey;
	}

	public encryptAsync(data: string): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				let iv = crypto.randomBytes(this._ivLength);
				let cipher = crypto.createCipheriv(
					'aes-256-cbc',
					Buffer.from(this._encryptionKey),
					iv
				);
				let encrypted = cipher.update(data);

				encrypted = Buffer.concat([encrypted, cipher.final()]);

				return resolve(`${iv.toString('hex')}:${encrypted.toString('hex')}`);
			} catch (e) {
				reject(e);
			}
		});
	}

	public decryptAsync(data: string): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				let textParts = data.split(':');
				let iv = Buffer.from(textParts.shift(), 'hex');
				let encryptedText = Buffer.from(textParts.join(':'), 'hex');
				let decipher = crypto.createDecipheriv(
					'aes-256-cbc',
					Buffer.from(this._encryptionKey),
					iv
				);
				let decrypted = decipher.update(encryptedText);

				decrypted = Buffer.concat([decrypted, decipher.final()]);

				return resolve(decrypted.toString());
			} catch (e) {
				reject(e);
			}
		});
	}
}

export interface IAesEncryptParameters<T extends object> {
	data: T;
	key: string;
}

export interface IAesEncryptResult {
	encryptedText?: string;
	aesResponseDto?: AesResponseDto;
}

export interface IAesEncryptWrapper<T extends object>
	extends IServiceHandlerAsync<IAesEncryptParameters<T>, IAesEncryptResult> {}

@Service()
export class AesEncryptWrapper<T extends object> implements IAesEncryptWrapper<T> {
	public async handleAsync(
		params: IAesEncryptParameters<T>
	): Promise<Result<IAesEncryptResult, ResultError>> {
		try {
			if (!params)
				return new Err(new ResultError(HttpStatusCode.BadRequest, 'parameter is null'));

			if (!params.data)
				return new Err(new ResultError(HttpStatusCode.BadRequest, 'data is null'));

			if (!params.key)
				return new Err(new ResultError(HttpStatusCode.BadRequest, 'key is null'));

			const aes = new AES(params.key);
			const body: string = JSON.stringify(params.data as object);

			if (!body) return new Err(new ResultError(HttpStatusCode.BadRequest, 'body is null'));

			const encryptedBody = await aes.encryptAsync(body);
			if (!encryptedBody)
				return new Err(new ResultError(HttpStatusCode.BadRequest, 'encryptedBody is null'));

			const aesResponseDto: AesResponseDto = new AesResponseDto();
			aesResponseDto.body = encryptedBody;

			const response: IAesEncryptResult = {
				encryptedText: encryptedBody,
				aesResponseDto: aesResponseDto,
			};

			return new Ok(response);
		} catch (ex) {
			return new Err(new ResultError(HttpStatusCode.InternalServerError, ex.message));
		}
	}
}

export interface IAesDecryptParameters {
	data: string;
	key: string;
}

export interface IAesDecryptWrapper<T extends object>
	extends IServiceHandlerAsync<IAesDecryptParameters, T> {}
@Service()
export class AesDecryptWrapper<T extends object> implements IAesDecryptWrapper<T> {
	public async handleAsync(params: IAesDecryptParameters): Promise<Result<T, ResultError>> {
		try {
			if (!params)
				return new Err(new ResultError(HttpStatusCode.BadRequest, 'parameter is null'));

			if (!params.data)
				return new Err(new ResultError(HttpStatusCode.BadRequest, 'data is null'));

			if (!params.key)
				return new Err(new ResultError(HttpStatusCode.BadRequest, 'key is null'));

			const aes = new AES(params.key);
			const decryptedBody = await aes.decryptAsync(params.data);
			if (!decryptedBody)
				return new Err(new ResultError(HttpStatusCode.BadRequest, 'decryptedBody is null'));

			const body: T = JSON.parse(decryptedBody);
			if (!body) return new Err(new ResultError(HttpStatusCode.BadRequest, 'body is null'));

			return new Ok(body as T);
		} catch (ex) {
			return new Err(new ResultError(HttpStatusCode.InternalServerError, ex.message));
		}
	}
}

```
### AES Helper Class
The AES class provides methods for AES encryption and decryption. It supports the aes-256-cbc algorithm and uses a randomly generated initialization vector (IV) for each operation.

#### Main Features:
- Encrypt Data:
```typescript
encryptAsync(data: string): Promise<string>
```
- Decrypt Data:
```typescript
decryptAsync(data: string): Promise<string>
```

### Wrapper Classes
The wrapper classes provide a structured way to handle encryption and decryption requests in the application.

#### AesEncryptWrapper
The AesEncryptWrapper class handles the encryption of the payload.
```typescript
Method: handleAsync(params: IAesEncryptParameters<T>): Promise<Result<IAesEncryptResult, ResultError>>
```
#### AesDecryptWrapper
The AesDecryptWrapper class handles the decryption of the payload.

```typescript
Method: handleAsync(params: IAesDecryptParameters): Promise<Result<T, ResultError>>
```
Link: https://github.com/KishorNaik/Sol_Aes_ExpressJs/blob/main/src/shared/utils/helpers/aes/index.ts

### Aes DTO Classes
The DTO classes are used to represent the data transfer objects for encryption and decryption operations.

```typescript
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AesRequestDto {
	@IsNotEmpty()
	@IsString()
	@Type(() => String)
	body?: string;
}
```
#### AesRequestDto
The AesRequestDto class is used to structure the request body sent from the client side. It validates that the body property is a non-empty string.


Link: https://github.com/KishorNaik/Sol_Aes_ExpressJs/blob/main/src/shared/models/request/aes.RequestDto.ts

```typescript
export class AesResponseDto {
	body?: string;
}
```
#### AesResponseDto
The AesResponseDto class is used to structure the response body sent by the server. It contains a single property, body, which is a string.
Link: https://github.com/KishorNaik/Sol_Aes_ExpressJs/blob/main/src/shared/models/response/aes.ResponseDto.ts

### Domain Contract DTO Classes
These classes handle the actual request and response data for encryption and decryption operations. For demo purpose, I have used the following DTO classes:

#### DemoAesRequestDto
The DemoAesRequestDto class structures the request body. It includes validation to ensure the firstName and lastName properties are non-empty strings and do not contain HTML or JavaScript code.
```typescript
import { IsSafeString } from '@/shared/utils/validations/decorators/isSafeString';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class DemoAesRequestDto {
    @IsNotEmpty()
    @IsString()
    @IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
    @Type(() => String)
    public firstName: string;

    @IsNotEmpty()
    @IsString()
    @IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
    @Type(() => String)
    public lastName: string;
}

```
#### DemoAesResponseDto
The DemoAesResponseDto class structures the response body. It contains the firstName and lastName properties as strings.
```typescript
export class DemoAesResponseDto {
    public firstName: string;

    public lastName: string;
}

```
link:https://github.com/KishorNaik/Sol_Aes_ExpressJs/blob/main/src/modules/demo/apps/contracts/v1/demoAes/index.Contract.ts

### Decrypt Request Service Class
The AesDemoDecryptService class is responsible for decrypting the encrypted request body into its original format. This class extends the AesDecryptWrapper class, which provides the core decryption functionality. The main purpose of this class is to serve as a specialized service for decrypting DemoAesRequestDto objects.
```typescript
import { DemoAesRequestDto } from '@/modules/demo/apps/contracts/v1/demoAes/index.Contract';
import { sealed } from '@/shared/utils/decorators/sealed';
import { AesDecryptWrapper } from '@/shared/utils/helpers/aes';
import { Service } from 'typedi';

@sealed
@Service()
export class AesDemoDecryptService extends AesDecryptWrapper<DemoAesRequestDto> {
	public constructor() {
		super();
	}
}
```
Link:
https://github.com/KishorNaik/Sol_Aes_ExpressJs/blob/main/src/modules/demo/apps/features/v1/demoAes/services/decryptRequest/index.ts

### Encrypt Response Service Class
The AesDemoEncryptResponseService class is responsible for encrypting the response body before sending it back to the client. This class extends the AesEncryptWrapper class, which provides the core encryption functionality. The main purpose of this class is to serve as a specialized service for encrypting DemoAesResponseDto objects.
```typescript
import { DemoAesResponseDto } from '@/modules/demo/apps/contracts/v1/demoAes/index.Contract';
import { sealed } from '@/shared/utils/decorators/sealed';
import { AesEncryptWrapper } from '@/shared/utils/helpers/aes';
import { Service } from 'typedi';

@sealed
@Service()
export class AesDemoEncryptResponseService extends AesEncryptWrapper<DemoAesResponseDto> {
	public constructor() {
		super();
	}
}
```
link:https://github.com/KishorNaik/Sol_Aes_ExpressJs/blob/main/src/modules/demo/apps/features/v1/demoAes/services/encryptResponse/index.ts

### Command and Command Handler Classes
These classes are responsible for handling AES encryption and decryption operations in the application. They integrate various services to ensure the request and response are correctly processed.

#### DemoAesCommand Class
The DemoAesCommand class encapsulates the request data for AES operations. It extends RequestData and includes the request object of type AesRequestDto.

- Properties:
_request: A private readonly property holding the AesRequestDto object.

- Constructor:
Initializes the _request property with the provided AesRequestDto object.

- Getter:
get request: Returns the _request property.
```typescript
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
```

### DemoAesCommandHandler Class
The DemoAesCommandHandler class handles the execution of the DemoAesCommand by utilizing various services for decryption, validation, and encryption. It implements the RequestHandler interface.

- Services:

  - _aesDecryptService: Decrypts the encrypted request body.
  - _validationService: Validates the decrypted request.
  - _aesEncryptResponseService: Encrypts the response body.

- Constructor:
Initializes the service dependencies using Container.get() method.

- Methods:

  - handle: Processes the DemoAesCommand and returns the ApiDataResponse<AesResponseDto>.

    - Validates the command and request.
    - Decrypts the request body.
    - Validates the decrypted request.
    - Maps the decrypted request to a response DTO.
    - Encrypts the response.
    - Returns the encrypted response or an error message.
```typescript
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

            // Decrypt the request
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

            // Validate the request
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

```
Link: https://github.com/KishorNaik/Sol_Aes_ExpressJs/blob/main/src/modules/demo/apps/features/v1/demoAes/index.ts
Note: I am using `https://www.npmjs.com/package/mediatr-ts` for managing the command and query handlers.

### DemoAesController Class
The DemoAesController class defines an endpoint using the routing-controllers package. This endpoint handles POST requests at the route /api/v1/demo and processes a command with MediatR.

- Route: /api/v1/demo
- HTTP Method: POST
- Method:
    - demoEndpoint: This method processes incoming requests. It takes in a request object of type AesRequestDto, and uses MediatR to send a DemoAesCommand. The response is returned as a JSON object with a status code of 200 OK if successful, or 400 Bad Request if the request is invalid.
```TypeScript
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
```
Link:https://github.com/KishorNaik/Sol_Aes_ExpressJs/blob/main/src/modules/demo/apps/features/v1/demoAes/index.ts
Note: I am using https://www.npmjs.com/package/routing-controllers/v/0.6.0-beta.3#routing-controllers for managing the endpoints.

### Demo Aes Integration Test
This code provides an integration test for the demo AES endpoint. The test framework used includes node:test, expect, and supertest. It validates the demoEndpoint defined in the DemoAesController class. The test environment is set to 'development' and uses a specified ENCRYPTION_KEY for demonstration purposes.

#### Test Environment Setup
- NODE_ENV is set to 'development'.
- ENCRYPTION_KEY is set to 'RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M6'.

The environment variables are validated using ValidateEnv().

#### App Initialization
The App class is initialized with the modulesFederation configuration.

An instance of the server is created using appInstance.getServer().

#### Test Case
describe('Demo Aes Integration Test', () => { ... }) defines the integration test suite.

The test case it('should_return_true_if_all_service_return_ok', async () => { ... }) sends a POST request to /api/v1/demo with an encrypted request body.

The test expects the response status to be 200 OK.

#### Encryption Key Usage
For demonstration purposes, the encryption key is hardcoded in the .env file.

In a production environment, each end user will have their own unique ENCRYPTION_KEY, which helps avoid single point of failure.The encryption key is stored in the users table.

```TypeScript
// Debug Mode:All Test Case Run
//node --trace-deprecation --test --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/integration/index.test.ts

// Debug Mode:Specific Test Case Run
//node --trace-deprecation --test --test-name-pattern='test_name' --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/integration/index.test.ts

// If Debug not Worked then use
//node --trace-deprecation --test --test-name-pattern='test_name' --require ts-node/register --inspect=4321 -r tsconfig-paths/register ./src/modules/demo/tests/integration/index.test.ts

import 'reflect-metadata';
import { describe, it } from 'node:test';
import expect from 'expect';
import request from 'supertest';
import { App } from '@/app';
import { ValidateEnv } from '@/shared/utils/validations/env';
import { modulesFederation } from '@/moduleFederation';

process.env.NODE_ENV = 'development';
process.env.ENCRYPTION_KEY = 'RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M6';
ValidateEnv();

const appInstance = new App([...modulesFederation]);
const app = appInstance.getServer();

describe('Demo Aes Integration Test', () => {
	// node --trace-deprecation --test --test-name-pattern='should_return_true_if_all_service_return_ok' --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/integration/index.test.ts
	it('should_return_true_if_all_service_return_ok', async () => {
		const response = await request(app).post('/api/v1/demo').send({
			body: '31cb5787acd4d7e14b3d93aa72cc8ddb:3efb69ded0ab33cfca1ce89575ed3b18657e2d20c3da2590973aca8dcad7bb980790267f8667bd8465f2c7fb1a6947f6',
		});
		expect(response.status).toBe(200);
	});
});

```
Link: https://github.com/KishorNaik/Sol_Aes_ExpressJs/blob/main/src/modules/demo/tests/integration/index.test.ts

### AES Tool for Encryption and Decryption
This code defines an AES tool for encrypting and decrypting data. The tool is implemented using the AES class from @/shared/utils/helpers/aes and utilizes the ENCRYPTION_KEY from the configuration file.
``` typeScript
/*
Command:
npx ts-node-dev --inspect=4321 --pretty --transpile-only -r tsconfig-paths/register src/zone/tools/aes/index.ts
*/

import { ENCRYPTION_KEY } from '@/config';
import { AES } from '@/shared/utils/helpers/aes';

//console.log('Hello World!');

// Request Body
export const requestBody = {
	firstName: 'kishor',
	lastName: 'naik',
};

const aes = new AES(ENCRYPTION_KEY);

// Encrypt
const encryptAsync = async (): Promise<void> => {
	const encryptRequestBody = await aes.encryptAsync(JSON.stringify(requestBody));
	console.log('encryptRequestBody: ', encryptRequestBody);
};

// Decrypt
const decryptAsync = async (encryptRequestBody: string): Promise<void> => {
	const decryptRequestBody = await aes.decryptAsync(encryptRequestBody);
	console.log('decryptRequestBody: ', JSON.parse(decryptRequestBody));
};

encryptAsync()
	.then()
	.catch((ex) => console.log('ex: ', ex));

// decryptAsync("130b3f9afd550f94aedf7315176cb2e7:42cb98153d8ab2d95b1c6bc308ae228d6b5bb4306f25e3a5b18fb9d19cb99a746a332d5354880adfdc0bb27fe6edb94a")
//     .then()
//     .catch((ex)=>console.log("ex:",ex));
```
Link: https://github.com/KishorNaik/Sol_Aes_ExpressJs/blob/main/src/zone/tools/aes/index.ts

