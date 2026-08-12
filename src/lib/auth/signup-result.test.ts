import assert from "node:assert/strict";
import test from "node:test";

import { isExistingEmailSignup } from "./signup-result.ts";

test("identity가 없는 회원가입 응답을 기존 이메일로 판별한다", () => {
  assert.equal(isExistingEmailSignup({ identities: [] }), true);
});

test("새 identity가 생성된 회원가입 응답은 정상 가입으로 판별한다", () => {
  assert.equal(
    isExistingEmailSignup({
      identities: [
        {
          id: "identity-id",
          identity_id: "identity-id",
          user_id: "user-id",
          identity_data: { email: "new-user@example.com" },
          provider: "email",
          created_at: "2026-08-12T00:00:00.000Z",
          updated_at: "2026-08-12T00:00:00.000Z",
          last_sign_in_at: "2026-08-12T00:00:00.000Z",
        },
      ],
    }),
    false,
  );
});

test("사용자 또는 identity 정보가 없으면 중복이라고 단정하지 않는다", () => {
  assert.equal(isExistingEmailSignup(null), false);
  assert.equal(isExistingEmailSignup({}), false);
});
