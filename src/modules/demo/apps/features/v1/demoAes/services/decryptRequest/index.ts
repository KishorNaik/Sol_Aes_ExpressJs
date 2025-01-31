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
