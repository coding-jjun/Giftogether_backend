# wishlist_funding_backend

## File naming convention

- 여러 단어일 경우, `-`를 기준으로 구분합니다.
- 동사가 섞인 파일 (ex. `create-user.dto.ts`)일 경우, 동사가 먼저 옵니다.

## How to run this server (test environment)

1. [node.js 설치](https://nodejs.org/en)
2. 의존성 설치 with `npm i`
3. redis server 로컬 설치 [하단 참조](#Install-Redis-Server-Locally)
4. [`.env` 설정](#env-설정)
5. [`global-bundle.pem`키 설정](#globalbundlepem-키-설정) -> S3를 위해 받아놓아야 합니다.
6. 실행 (watch 모드) with `npm run start:dev` (debug 모드) with `npm run start:debug`

## How to run this server (test environment with docker 🐳)

1. [Docker 설치](https://www.docker.com) 윈도우의 경우, WSL2 사용
2. [`.env` 설정](#env-설정)
3. [`docker/redis.conf` 설정](#dockerredisconf-설정)
4. [`global-bundle.pem`키 설정](#globalbundlepem-키-설정) -> S3를 위해 받아놓아야 합니다.
5. 실행 (debug 모드) with `docker-compose -f docker-compose.development.yml up`

**지원하는 기능**:

- inspect: 테스트 환경에서 소스코드 저장시 자동으로 Nest 서버 재부팅
- debug: 도커 테스트 환경에서 VSCode "Attach Node in Docker"

## .env 설정

```.env
# DEBUG MODE (true/false)
DEBUG=

# NODE
TZ=

# NestJS
PORT=

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
AWS_S3_REGION=
AWS_S3_HOST=
AWS_REGION=
REGISTRY=

# Postgres
DB_HOST=
DB_PORT=
# =============[ DEVELOP ]=============
DB_DEV_DATABASE=
DB_DEV_USERNAME=
DB_DEV_PASSWORD=
# =============[ PRODUCT ]=============
DB_PROD_1_DATABASE=
DB_PROD_1_USERNAME=
DB_PROD_1_PASSWORD=
# =============[ TEST ]=============
DB_TEST_DATABASE=
DB_TEST_USERNAME=
DB_TEST_PASSWORD=

# Auth
# =============[ KAKAO ]=============
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_CALLBACK_URI=

# =============[ JWT ]=============
JWT_SECRET=
JWT_REFRESH_SECRET=

# =============[ NAVER ]=============
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_CALLBACK_URI=

# =============[ GOOGLE ]=============
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URI=

# Redis
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

# =============[ Redirect Url ]=============
LOGIN_URL=
SIGNUP_URL=
COOKIE_DOMAIN=
CORS_ORIGIN=

# =============[ SSL ]=============
SSL_CERTIFICATE_LOCATION=
SSL_KEY_LOCATION=

# =============[ Docker ]=============
IMAGE_NAME=
CONTAINER_NAME=
```

## docker/redis.conf 설정

도커 redis 설정파일입니다.

```conf
# 연결 가능한 네트위크(0.0.0.0 = Anywhere)
bind 0.0.0.0

# 연결 포트
port 6379

# Master 노드의 기본 사용자 비밀번호
requirepass <YOUR-PASSWORD>

# 최대 사용 메모리 용량(Default : 시스템 전체 용량)
maxmemory 2gb

# 설정된 최대 사용 메모리 용량을 초과했을때 처리 방식
maxmemory-policy volatile-ttl

# RDB 설정 (주기적 백업)
# 15분 안에 최소 1개 이상의 key가 변경되었을 때
save 900 1
# 5분 안에 최소 10개 이상의 key가 변경되었을 때
save 300 10
# 60초 안에 최소 10000개 이상의 key가 변경되었을 때
save 60 10000
```

## global-bundle.pem 키 설정

amazon rds에 접속하기 위해서 certificate bundle이 필요합니다. 아래 사이트에 접속하여 `global-bundle.pem` 키를 다운받아 프로젝트 루트폴더에 옮겨놓아주십시오.

https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html#UsingWithRDS.SSL.CertificatesDownload

## Install Redis Server Locally

- 로컬에서만 가능해요!
    - Window → 아래 설치
        
        [Redis-x64-3.0.504.msi](https://prod-files-secure.s3.us-west-2.amazonaws.com/a58622d1-e964-481a-b684-e2f5510530c0/c315cca0-5fbd-4c16-b567-8f5184a44734/Redis-x64-3.0.504.msi)
        
    - https://innovation123.tistory.com/186
    - 로컬에서 테스트 해볼 수 있습니다.
    - MAC → https://wlswoo.tistory.com/44
    - redis 비밀번호 설정 https://peterica.tistory.com/421
    
    ```bash
    # 비밀번호 설정 (개발자 선택사항)
    auth #{PASSWORD}
    >> OK
    
    # key 조회
    keys *
    get #{KEY}
    ```
    

- `CLIENT_ID` , `CLIENT_SECRET` :  SNS 서버에서 발급
- `JWT_SECRET`, `JWT_REFRESH_SECRET` : 임의로 설정한 키
