import axios, { AxiosError } from 'axios';

export class OpenBankApiClient {
  private openApiUrl = 'https://testapi.openbanking.or.kr/oauth/2.0/';

  private clientId = process.env.CLIENT_ID;
  private clientSecret = process.env.CLIENT_SECRET;
  private redirectUri = 'http://localhost:3000/api/test';

  async requestOpenBankToken(code: string) {
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('redirect_uri', this.redirectUri);
    params.append('grant_type', 'authorization_code');

    console.log('URL: ', this.openApiUrl + 'token');
    console.log('Parms : ', params.toString());
    try {
      const responseToken = await axios.post(
        this.openApiUrl + 'token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      console.log(responseToken);
      if ('rsp_code' in responseToken.data) {
        throw new Error('OpenBank Token Request Error.');
      }
      return responseToken.data;
    } catch (error) {
      console.error('Error requesting Open Bank token:', error);
      if (error instanceof AxiosError) {
        throw new Error(
          `API Error: ${error.response?.status} ${error.response?.data.error}`,
        );
      } else {
        throw new Error(
          'Network or unknown error occurred while requesting token.',
        );
      }
    }
  }
}
