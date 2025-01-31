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
