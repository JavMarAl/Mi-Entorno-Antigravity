Set oWS = WScript.CreateObject("WScript.Shell")
oWS.Run "cmd /c cd /d """c:\Trabajos Antigravity\BDSKILLSSTITCH\PythonLearningApp""" & npm run dev", 0, False
WScript.Sleep 4000
oWS.Run "http://localhost:3000"
