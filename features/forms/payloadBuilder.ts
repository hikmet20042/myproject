export type PayloadBuilder<FormData, Payload> = (formData: FormData) => Payload

export const createPayloadBuilder = <FormData, Payload>(
  builder: PayloadBuilder<FormData, Payload>,
) => builder
