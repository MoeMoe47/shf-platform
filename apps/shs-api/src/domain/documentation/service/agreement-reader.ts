import { ServiceAgreementService } from "../../service-agreements/service/service-agreement-service.js";

export interface AgreementVersionReader {
  resolve(actor: any, agreementReference: string, version: string): Promise<any | null>;
}

export class CanonicalServiceAgreementReader implements AgreementVersionReader {
  constructor(private readonly service = new ServiceAgreementService()) {}
  async resolve(actor: any, agreementReference: string, version: string) {
    const agreement = await this.service.getAgreement(agreementReference, actor);
    if (!agreement) return null;
    const versions = await this.service.listVersions(agreementReference, actor);
    const match = versions?.find((item: any) => String(item.version_number) === String(version));
    return match ? { agreement, version: match } : null;
  }
}
