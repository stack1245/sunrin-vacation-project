# Supabase Gmail SMTP 운영 가이드

OutOfBounds의 회원가입·인증 메일은 애플리케이션이 SMTP 서버에 직접
접속하지 않고, **Supabase Auth의 Custom SMTP**를 통해 발송한다. Gmail
SMTP 인증 정보는 Supabase Dashboard에서만 관리하며 프로젝트 코드,
`.env.local`, `.env.example`, 문서, 이슈 또는 로그에 복사하지 않는다.

이 프로젝트가 사용하는 이메일 인증 완료 경로는 `/auth/confirm`이다.
Supabase 문서의 일반적인 `/auth/callback` 예시와 다르므로, Dashboard에도
반드시 실제 프로젝트 경로인 `/auth/confirm`을 등록한다.

## Gmail 준비

1. SMTP 발송에 사용할 Google 계정에서 2단계 인증을 활성화한다.
2. Google 계정의 앱 비밀번호를 생성한다.
3. Gmail 계정의 일반 비밀번호가 아니라 앱 비밀번호를 Supabase Custom
   SMTP 인증에 사용한다.
4. Google 계정 비밀번호를 변경한 뒤 발송이 실패하면 기존 앱 비밀번호가
   폐기되었는지 확인하고 새 앱 비밀번호를 발급한다.

앱 비밀번호는 다시 전체 값을 확인하기 어려우므로 생성 직후 Supabase
Dashboard에 입력하고, 별도 평문 파일에 저장하거나 Git에 커밋하지 않는다.

## Supabase Dashboard 설정

### Authentication → SMTP Settings

- Custom SMTP가 활성화되어 있는지 확인한다.
- Host는 `smtp.gmail.com`으로 설정한다.
- Port는 암호화 방식에 맞게 설정한다.
  - `465`: SSL 연결
  - `587`: STARTTLS 연결
- Sender email과 SMTP 사용자 계정이 의도한 Google 계정인지 확인한다.
- Sender name은 사용자가 메일의 발신자를 알아볼 수 있도록
  `OutOfBounds`처럼 명확하게 설정한다.
- Password에는 Google 계정의 일반 비밀번호가 아닌 앱 비밀번호를
  입력한다.
- 저장 후 Dashboard가 제공하는 테스트 기능 또는 아래 수동 회원가입
  절차로 발송을 확인한다.

SMTP 사용자명, 앱 비밀번호와 같은 인증값은 클라이언트에서 사용할
환경변수가 아니다. 특히 공개 환경변수, 브라우저 번들 또는
`.env.example`에 추가하면 안 된다.

### Authentication → URL Configuration

로컬 개발 환경의 기본 설정 예시는 다음과 같다.

```text
Site URL: http://localhost:3000
Redirect URL: http://localhost:3000/auth/confirm
```

프로덕션에서는 실제 배포가 확정된 HTTPS 도메인을 사용한다.

```text
Site URL: https://<production-domain>
Redirect URL: https://<production-domain>/auth/confirm
```

운영 도메인을 추측해 등록하지 않는다. 개발 서버의 포트가 `3000`과
다르다면 브라우저에서 실제로 사용하는 origin과 `/auth/confirm` 조합을
별도의 Redirect URL로 정확히 추가한다.

애플리케이션은 회원가입과 재전송 요청 시 현재 페이지의
`window.location.origin`을 기준으로 인증 완료 URL을 만든다. 따라서
로컬과 프로덕션 모두를 지원하기 위한 별도 사이트 URL 환경변수는 현재
필요하지 않다. Supabase의 Redirect URL 허용 목록은 계속 최종 안전
경계로 유지해야 한다.

### Authentication → Email Templates

`Confirm signup` 템플릿의 인증 링크 변수를 임의의 URL로 바꾸지 않는다.
권장 제목은 다음과 같다.

```text
[OutOfBounds] 이메일 인증을 완료해 주세요
```

권장 HTML 본문 예시는 다음과 같다.

```html
<h2>OutOfBounds 회원가입 요청</h2>
<p>아래 버튼을 눌러 이메일 인증을 완료해 주세요.</p>
<p><a href="{{ .ConfirmationURL }}">이메일 인증하기</a></p>
<p>본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.</p>
```

`{{ .ConfirmationURL }}`은 Supabase가 생성하는 인증 URL이므로 철자,
중괄호 또는 URL을 변경하지 않는다. 메일 발송 서비스의 클릭 추적 기능이
링크를 다시 작성하면 인증 링크가 손상될 수 있으므로, 문제가 발생하면
링크 추적 또는 URL rewriting 기능도 확인한다.

### Authentication → Rate Limits

- 현재 프로젝트의 인증 메일 발송 한도를 확인한다.
- Gmail/Google Workspace 측의 발송 한도도 함께 고려한다.
- 앱의 재전송 버튼에는 연속 요청을 막는 60초 cooldown이 있지만,
  서버 측 보안 경계는 Supabase Dashboard의 Rate Limits이다.
- 한도를 과도하게 높이지 말고 예상 사용자 수와 발송량에 맞춰 조정한다.

## 수동 통합 테스트

실제 SMTP 전달 여부는 애플리케이션 빌드나 자동 테스트만으로 확인할 수
없다. Supabase 설정을 저장한 뒤, 테스트에 사용할 수신 주소로 다음
절차를 직접 실행한다. 실제 이메일 주소를 소스 코드나 테스트 파일에
하드코딩하지 않는다.

1. 시크릿 브라우저 또는 로그아웃 상태에서 `/signup`을 연다.
2. 닉네임, 테스트 수신 주소와 유효한 비밀번호로 회원가입한다.
3. 인증 대기 안내에 입력한 주소가 올바르게 표시되는지 확인한다.
4. 받은편지함과 스팸함에서 OutOfBounds 인증 메일을 확인한다.
5. 메일의 인증 링크를 눌러 `/auth/confirm`으로 돌아오는지 확인한다.
6. 인증 성공 안내가 표시되고 로그인 세션이 생성되는지 확인한다.
7. 메인 화면의 START를 눌러 인증된 사용자만 스테이지 화면으로
   진입하는지 확인한다.
8. 별도의 미인증 테스트 계정으로 로그인해 인증 안내와 재전송 버튼이
   표시되는지 확인한다.
9. 재전송 직후 버튼이 60초 동안 비활성화되고 남은 시간이 표시되는지
   확인한다.
10. 만료되었거나 이미 처리한 링크를 다시 열어 앱이 중단되지 않고
    재요청 안내를 보여 주는지 확인한다.

재전송 메일이 여러 통 도착할 수 있으므로 가장 최근에 요청한 메일의
링크를 우선 사용한다.

## 발송 실패 점검 순서

1. Supabase Dashboard의 Auth 로그에서 발송 요청과 오류 코드를 확인한다.
2. Custom SMTP가 활성화되어 있고 Host, Port, 사용자명과 Sender email이
   올바른지 확인한다.
3. Google 2단계 인증과 앱 비밀번호 상태를 확인한다.
4. Google 계정 비밀번호를 최근 변경했다면 앱 비밀번호를 새로 생성해
   Supabase Dashboard 값을 갱신한다.
5. 수신자의 스팸함과 Gmail 발송 제한을 확인한다.
6. Site URL과 `/auth/confirm` Redirect URL이 현재 origin과 정확히
   일치하는지 확인한다.
7. 이메일 템플릿이 `{{ .ConfirmationURL }}`을 그대로 사용하는지
   확인한다.
8. 메일 링크 추적이나 보안 도구가 인증 URL을 다시 쓰지 않았는지
   확인한다.
9. Authentication → Rate Limits에서 이메일 발송 제한에 도달했는지
   확인한다.

오류를 공유할 때도 비밀번호, 앱 비밀번호, 인증 토큰, 전체 세션 또는
SMTP 인증값을 로그나 화면 캡처에 포함하지 않는다.

## 운영 전 최종 체크리스트

- [ ] Authentication → SMTP Settings에서 Gmail Custom SMTP가 활성화됨
- [ ] Host가 `smtp.gmail.com`이고 Port와 암호화 방식이 일치함
- [ ] Google 2단계 인증 및 앱 비밀번호를 사용함
- [ ] Gmail 계정의 일반 비밀번호를 사용하지 않음
- [ ] Authentication → URL Configuration의 Site URL이 실제 환경과 일치함
- [ ] 로컬 Redirect URL에 `http://localhost:3000/auth/confirm`이 등록됨
- [ ] 프로덕션 Redirect URL에 실제 HTTPS 도메인의 `/auth/confirm`이 등록됨
- [ ] Authentication → Email Templates의 인증 URL 변수가 그대로 유지됨
- [ ] Authentication → Rate Limits가 예상 발송량에 맞게 설정됨
- [ ] 수동 회원가입, 인증, 재전송, 만료 링크 테스트를 완료함
- [ ] SMTP 및 Supabase 비밀값이 코드, 환경변수 예제와 Git 기록에 없음
