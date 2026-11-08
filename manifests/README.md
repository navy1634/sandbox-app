# Kubernetes manifests

API、web、database の manifest です。

## 構成

```mermaid
flowchart TD
  Client[Client]
  Ingress[Ingress]
  WebService[web Service]
  APIService[api Service]
  DatabaseService[database Service]
  WebDeployment[web Deployment]
  APIDeployment[api Deployment]
  DatabaseStatefulSet[database StatefulSet]
  WebPod[web Pod]
  APIPod[api Pod]
  DatabasePod[database Pod]

  Client --> Ingress
  Ingress --> WebService
  Ingress --> APIService
  WebService --> WebPod
  APIService --> APIPod
  APIPod --> DatabaseService
  DatabaseService --> DatabasePod

  WebDeployment -. manages .-> WebPod
  APIDeployment -. manages .-> APIPod
  DatabaseStatefulSet -. manages .-> DatabasePod
```

## Secret

```sh
kubectl create namespace sandbox-app

kubectl -n sandbox-app create secret generic sandbox-app-database-secret \
  --from-literal=POSTGRES_DB=test \
  --from-literal=POSTGRES_USER=postgres \
  --from-literal=POSTGRES_PASSWORD='replace-me'

kubectl -n sandbox-app create secret generic sandbox-app-api-secret \
  --from-literal=DATABASE_URL='postgres://postgres:replace-me@sandbox-app-database.sandbox-app.svc.cluster.local:5432/test?sslmode=disable' \
  --from-literal=OIDC_CLIENT_SECRET='replace-with-the-sandbox-auth-client-secret' \
  --from-literal=APP_AUTH_SECRET='replace-with-at-least-32-bytes'

kubectl -n sandbox-app create secret tls sandbox-app-tls \
  --cert=/path/to/tls.crt \
  --key=/path/to/tls.key
```

## ローカル HTTPS

ブラウザが使う OS の信頼ストアへ、`mkcert` のローカル CA を登録します。

```sh
mkcert -install
```

開発用ドメインの証明書を作成します。

```sh
mkcert app.sandbox.navy1634.com
```

作成された証明書を Kubernetes の TLS Secret として登録します。

```sh
kubectl -n sandbox-app delete secret sandbox-app-tls
kubectl -n sandbox-app create secret tls sandbox-app-tls \
  --cert=app.sandbox.navy1634.com.pem \
  --key=app.sandbox.navy1634.com-key.pem
```

ブラウザが使う OS の hosts に、Ingress の IP と開発用ドメインを設定します。

```txt
192.168.0.242 app.sandbox.navy1634.com
```

## 設定

適用する overlay の `api-configmap.yaml`、`web-configmap.yaml`、`ingress.yaml` を編集します。

`OIDC_ISSUER_URL` はブラウザから到達できるsandbox_authのIssuer、`OIDC_INTERNAL_URL` はアプリAPIからDiscovery・Token・JWKSへ到達するURLを指定します。`OIDC_REDIRECT_URL` はアプリAPIの公開callback URLです。`NEXT_PUBLIC_API_BASE_URL` は同一originのAPIを使う場合は空文字にします。

`web-configmap.yaml` の `WAITING_ROOM_PUBLIC_URL` にはブラウザー向けの待合室URLを、`WAITING_ROOM_INTERNAL_URL` にはWeb Podから使う待合室Service URLを指定します。待合室側の `APP_RETURN_ORIGIN` にはアプリの公開originを設定し、`SESSION_COOKIE_DOMAIN` には両方のホストを含む親ドメインを設定します。

`WAITING_ROOM_ENABLED` の既定値は `false` です。負荷上昇に備えて入場制限を行う場合は `true` に変更し、ConfigMapを適用してWeb Deploymentを再起動します。切り替え手順は [WebのREADME](../web/README.md#仮想待合室) を参照してください。

## 適用

```sh
kubectl apply -k manifests/overlays/{dev|prd}
```
