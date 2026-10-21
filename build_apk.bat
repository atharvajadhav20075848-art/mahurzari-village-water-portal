@echo off
set "JAVA_HOME=D:\ANDOID\jbr"
set "PATH=D:\ANDOID\jbr\bin;%PATH%"
set "ANDROID_HOME=C:\Users\Atharva\AppData\Local\Android\Sdk"

echo Java Home is: %JAVA_HOME%
java -version

echo Running Capacitor Sync...
call npx cap sync android

echo Building Android Debug APK...
cd android
call gradlew assembleDebug
echo Done with build.
