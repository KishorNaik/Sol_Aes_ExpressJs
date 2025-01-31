import { DemoAesRequestDto } from '@/modules/demo/apps/contracts/v1/demoAes/index.Contract';
import { sealed } from '@/shared/utils/decorators/sealed';
import { DtoValidation } from '@/shared/utils/validations/dto';
import { Service } from 'typedi';

@sealed
@Service()
export class AesDemoValidationService extends DtoValidation<DemoAesRequestDto> {
	public constructor() {
		super();
	}
}
