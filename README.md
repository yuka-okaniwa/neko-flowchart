# ねこ社員のフローチャート

お祭りで使う、iPad Safari向けのフローチャート学習アプリです。会場PCのDockerから、社内Wi-Fi上のiPadへ配信します。

設計は [docs/plan.md](docs/plan.md) に保存しています。

## 開発開始

```sh
npm install
npm run dev
```

## 会場PCでの起動（Docker）

Docker Desktopが起動していることを確認してから、プロジェクト直下で実行します。

```sh
docker compose up -d --build
```

- 会場PC自身で開く場合: `http://localhost:18080`
- iPadから開く場合: `http://<会場PCのLANアドレス>:18080`

停止する場合は次を実行します。

```sh
docker compose down
```

アプリはコンテナ内のNginx（80番ポート）で配信され、PCの **18080番ポート** に公開されます。iPadと会場PCは同じ社内Wi-Fiに接続してください。
