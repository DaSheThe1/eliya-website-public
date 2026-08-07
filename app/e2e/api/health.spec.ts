import { expect, test } from "@playwright/test";

import packageMetadata from "../../package.json";
import { hasServerApi, testSite } from "../site-fixture";

test.beforeEach(() => {
  test.skip(
    !hasServerApi,
    "Static profile health is provided by the deployed Worker contract.",
  );
});

test("health accepts a runtime adapter that matches the generated contract", async ({
  request,
}) => {
  const response = await request.get(`${testSite.basePath}/api/health`);
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    ok: true,
    version: packageMetadata.version,
    ready: true,
  });
});
