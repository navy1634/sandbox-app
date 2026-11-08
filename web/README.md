# app

Next.js のフロントエンドです。アプリAPIのOIDCログイン開始URLへ遷移し、callback後のユーザー情報とDB保存結果を表示します。

## 主な画面

| パス | 内容 |
| ---- | ---- |
| `/` | トップページです。OIDCログインを開始できます。 |
| `/dashboard` | OIDC IDトークンから得たユーザー情報とDB保存結果を確認できます。 |

## バックエンド連携

API の接続先は `NEXT_PUBLIC_API_BASE_URL` で指定します。

```txt
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
```

Docker Compose で起動する場合は、ルートディレクトリの `SANDBOX_API_URL` が `NEXT_PUBLIC_API_BASE_URL` に渡されます。

Docker イメージは環境ごとに作り分けません。次の同一コマンドでビルドし、接続先はコンテナ起動時の環境変数または Kubernetes の `ConfigMap` で指定します。

```txt
docker build . -t sandbox-app-web
```

sandbox_auth側では、OIDC clientのcallback URLを完全一致で登録してください。

```txt
OIDC_CLIENTS=[{"client_id":"external-app","client_secret":"replace-with-a-random-secret","redirect_uris":["http://localhost:8081/auth/callback"]}]
```

## 仮想待合室

通常は仮想待合室を使わず、アプリのページを表示します。`WAITING_ROOM_ENABLED=true` を設定した場合だけ、入場状態を確認してからページを表示します。空き枠があればそのままアプリへ進み、満席なら順番を待ってから元のURLへ戻ります。有効時はブラウザーが定期的に入場枠を更新します。未設定、`false`、その他の値では入場確認と更新を行いません。

KubernetesではWebのConfigMapの `WAITING_ROOM_ENABLED` を変更し、Web Deploymentを再起動すると切り替わります。ソースの `web-configmap.yaml` にも運用する値を保存してください。

```sh
kubectl patch configmap sandbox-app-web-config -n sandbox-app --type merge -p '{"data":{"WAITING_ROOM_ENABLED":"true"}}'
kubectl rollout restart deployment/sandbox-app-web -n sandbox-app
```

無効に戻す場合は値を `false` にして同じ手順で再起動します。

Ingress 配下では、Ingress が設定する `X-Forwarded-Host` と `X-Forwarded-Proto` を公開 URL と Origin の判定に使います。Ingress は利用者から受け取った転送ヘッダーを信頼せず、実際のホストとプロトコルで設定してください。

`WAITING_ROOM_PUBLIC_URL` にはブラウザーからアクセスできる待合室URLを、`WAITING_ROOM_INTERNAL_URL` にはWebサーバーからアクセスできる待合室URLを指定します。Docker Composeではそれぞれ `http://localhost:3100` と `http://host.docker.internal:3100` を使います。ホスト上で `pnpm dev` を起動する場合は、両方に `http://localhost:3100` を指定します。

待合室側では `APP_RETURN_ORIGIN` をこのアプリの公開originにし、`SESSION_COOKIE_DOMAIN` を待合室とアプリの両方を含む親ドメインに設定します。ローカル開発では待合室とアプリを `localhost` で開き、Cookie domainを空にします。Docker Composeから接続する待合室は、コンテナ外から到達できるアドレスで待ち受けてください。

## ローカル起動

```txt
pnpm install
pnpm dev
```

起動後は Next.js が表示した `Local` の URL にアクセスしてください。通常は `http://localhost:3000` です。`3000` が既に使われている場合は、Next.js が `3001` などの空きポートで起動します。

## コマンド

| コマンド | 内容 |
| -------- | ---- |
| `pnpm dev` | Next.js を開発起動します。 |
| `pnpm build` | Next.js をビルドします。 |
| `pnpm start` | ビルド済みの Next.js を起動します。 |
| `pnpm test` | 単体テストを実行します。 |
| `pnpm lint` | JavaScript と CSS の lint を実行します。 |
| `pnpm lint:js` | oxlint を実行します。 |
| `pnpm lint:css` | stylelint を実行します。 |
| `pnpm format` | oxfmt で整形します。 |
| `pnpm typecheck` | TypeScript の型チェックを実行します。 |
| `pnpm storybook` | Storybook を起動します。 |
| `pnpm build-storybook` | Storybook をビルドします。 |
