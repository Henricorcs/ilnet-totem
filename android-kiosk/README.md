# ILNET Totem Android Kiosk

App Android nativo para usar o tablet em modo totem. Ele abre `https://totem.ilnet.com.br/` em WebView fullscreen, tenta entrar em modo kiosk automaticamente e pode ser definido como launcher padrao do tablet.

## O que o app faz

- Abre direto no totem online.
- Roda em paisagem e fullscreen.
- Mantem a tela ligada.
- Esconde barras do sistema com modo imersivo.
- Bloqueia o botao voltar, voltando para a tela inicial do totem.
- Reinicia junto com o tablet.
- Pode ser configurado como app inicial/launcher.
- Suporta Android Lock Task / Device Owner para kiosk forte.

## Gerar APK

1. Abra esta pasta no Android Studio:

   ```text
   android-kiosk
   ```

2. Aguarde o Gradle Sync.
3. Para teste rapido, use:

   ```text
   Build > Build APK(s)
   ```

4. Para instalacao final, gere APK assinado:

   ```text
   Build > Generate Signed App Bundle / APK
   ```

Tambem e possivel gerar pelo terminal:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT="$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat assembleDebug
```

O APK de teste sai em:

```text
app/build/outputs/apk/debug/app-debug.apk
```

## Travamento simples

Esse modo e rapido e nao exige reset do tablet.

1. Instale o APK no tablet.
2. Abra Configuracoes do Android.
3. Ative `Fixacao de tela` ou `Screen pinning`.
4. Abra o app `ILNET Totem`.
5. Fixe o app na tela.

Esse modo evita saida casual, mas ainda permite sair usando o comando/PIN do Android.

## Kiosk forte com Device Owner

Esse e o modo recomendado para evento. Normalmente exige tablet recem-formatado.

1. Faca backup do tablet, se houver algo importante.
2. Restaure o tablet para configuracao de fabrica.
3. Na configuracao inicial, habilite opcoes de desenvolvedor e depuracao USB.
4. Instale o APK:

   ```bash
   adb install app-release.apk
   ```

5. Defina o app como device owner:

   ```bash
   adb shell dpm set-device-owner br.com.ilnet.totem/.KioskDeviceAdminReceiver
   ```

6. Abra o app e escolha `ILNET Totem` como launcher padrao quando o Android perguntar.

Quando configurado assim, o app chama `startLockTask()` automaticamente e o tablet fica preso no totem.

## Saida para manutencao

Toque 7 vezes no canto superior esquerdo da tela, dentro de 5 segundos. O app tenta pausar o modo kiosk para manutencao.

Se o tablet estiver usando apenas fixacao de tela simples, use tambem o comando/PIN do proprio Android para sair.
