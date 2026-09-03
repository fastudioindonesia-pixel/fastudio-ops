// FA STUDIO PORTAL — Google Apps Script Backend (server-side only; never ship in Index.html)
// Spreadsheet / Drive root IDs stay here (or Script Properties). Do not put them in client HTML/JS.
//
// SECURITY CHECKLIST — setiap fungsi publik baru (tanpa suffix _):
// 1) Wajibkan requireInternalRole_ / requireDirectorRole_, ATAU
// 2) Rename jadi namaFungsi_ agar tidak callable via google.script.run, ATAU
// 3) Jika sengaja publik (booking/OTP/login), validasi input + rate limit + jangan bocorkan ID/secret.
// Jangan pernah return spreadsheetUrl / SHEET_ID / DRIVE_FOLDER_ID ke client.
// ID sensitif HANYA dari Script Properties (Project Settings → Script properties).
// Jangan isi ulang literal di bawah ini. Key wajib:
//   SHEET_ID, DRIVE_FOLDER_ID, COMPANY_LOGO_FILE_ID, RECAPTCHA_SECRET_KEY
// RECAPTCHA_SITE_KEY boleh ada di source (desain publik) atau di Script Properties.
// Rotasi secret: https://www.google.com/recaptcha/admin → keys baru → update Script Property.
var SENSITIVE_IDS_ = {
  SHEET_ID: "",
  DRIVE_FOLDER_ID: "",
  COMPANY_LOGO_FILE_ID: "",
  RECAPTCHA_SITE_KEY: "6LcPXY0tAAAAALGr5NimT0Oi4Dx5YyUl7ZaPHfT9",
  RECAPTCHA_SECRET_KEY: "6LcPXY0tAAAAANKstR1TnVkULlRCgTA94awyhyPP"
};

var CONFIG = {
  SHEET_ID:        "",  // resolved by getConfig_ (Script Properties / SENSITIVE_IDS_)
  SHEET_LEADS:     "Leads",          // Nama tab sheet untuk leads
  SHEET_CLIENTS:   "ClientIntake",   // Nama tab sheet untuk client intake
  SHEET_PROD_HIST: "ProductionProgressHistory",
  SHEET_USERS:     "Users",          // Akun tim internal FA
  SHEET_CLIENT_USERS: "ClientUsers", // Akun client (Sign Up publik)
  SHEET_PAYMENTS:  "Payments",
  SHEET_PAY_HIST:  "PaymentStatusHistory",
  SHEET_PAY_INVOICES: "PaymentInvoices",
  SHEET_PAY_APPROVALS: "PaymentApprovals",
  SHEET_DEPT_APPROVALS: "ProductionDeptApprovals",
  SHEET_DRIVE_ASSETS: "DriveAssets",
  SHEET_AUDIT_LOG: "SecurityAuditLog",
  DRIVE_FOLDER_ID: "", // resolved by getConfig_
  EMAIL_FROM:      "fastudioindonesia@gmail.com",
  COMPANY_NAME:    "FA Studio Indonesia",
  COMPANY_TAGLINE: "Yours Unlimited Creativity",
  COMPANY_LOGO_FILE_ID: "",
  COMPANY_LOGO_BASE64: "iVBORw0KGgoAAAANSUhEUgAAAwMAAACgCAYAAABQQrD+AAAACXBIWXMAAAsSAAALEgHS3X78AAAgAElEQVR4nO2dTVMVRxuGu1PukdK9BH+ApHQvKTlr0ZRZKnFhliErshN3ugoutepVdKmlwTVQwj6U8ANQ2IdCfkG/9ZC7TdPM1zlMz3TP3FfVqQThzPTM9Mw89/PV2hij/rn804RSak6R1Fi+uPtuj1eNEEIIIYSMwjn5jhiU/1z+SYzKJaXUGM9kMmwopSgGCCGEEELISHxnv3Rx992yUmpaKbXDU0kIIYQQQkj3+c49wou777YhCJ7y2hNCCCGEENJtvhusH5x3j/Di7ruvF3ffzSulbimljnj9CSGEEEII6SYSGVgZrB+cKh6+uPtuRSk1xbQhQgghhBBCuolNE3o5WD9Y9o9QCosv7r6bYtoQIYQQQggh3cOtGbg3WD/YHqwfTPhHybQhQgghhBBCusd33hFdUUqJIJj2j5RpQ4QQQgghhHQLXwworDPwcbB+MO//gmlDhBBCCCGEdIcsMWD5c7B+sOJ3G1JMGyKEEEIIIaQTFIkB4aascjtYP5jyf8G0IUIIIYQQQtKmTAwo1BFs5LQfZdoQIYQQQgghiVJFDCjUEUj70aWsXzJtiBBCCCGEkPSoKgYsvw3WDzZy6giYNkQIIYQQQkhCDCsGhOtKqb2cOgKmDTXIxd13G705WEIIIYQQUjujiAGFtKFPWe1HFdOGmmK/H4dJCCGEEEJCMaoYsEj70WWmDbUCowKEEEIIIeRMnFUMCPfQbWjC/wXThoKy0uFjI4QQQgghDVCHGFBoP7o9WD+Yzfol04ZqZx+RF0IIIYQQQkamLjGgUEfw12D9YDHrl0wbqpXlDh0LIYQQQghpiTrFgOXhYP1gJaeOgGlDZ0cKhzPXeyCEEEIIIWQYQogB4SbShk61H1X/pQ39yI44IzF3cffd1wTHTQghhBBCIkPPrP2zgbUDQiA1AvOrNy5kprX8c/kniR5IWtFvnBiV+P3i7jtGBQghhBBCOorW+o5SarzK0Rljnqt/v/PA/n8ZWutJpdRVY8xb1YAYsLyCKMj0aP9z+acJiIJ7gceRMk8RUSGEEEII6Q1a6/OoO81jzxiz15XzobVeUEpNev8sAuFtxp//AeGwK/9vjHlSYftvIAYuqwbFgELh8NzqjQvbeX/giIJZFCQTRFcu7r5j0TAhgdFay8vG1ju5L589fI4xxnCdD0IIqRmt9TSeu/KZwH+HtQc3lVLifN62ny4IBa21GPsDY8znjN9NQgwcKqWuZf2N87czSqlVpdTnNsSA5dHqjQuZHYcsSB+axedmg2OLjU3UCHRG7RISC3jp2I+8dC4NObQj52Wz0ZUXDiGENAUcMLN4Doe0RffxnF4xxiTZmr2iGFiDkf9rwXb+xv+OtykGFC6KRAlKvWsQBvaFPdXCWNvgg3QMurj7Llnvo9a6l55TY8x0yO3DgC0U0zWz2CUvuNZ6LrCTYQcLAi6HEgZ4ebJ26CQixErTKAM8lyrtt24CzQGZs0NFoCN/ztto3lfHO5xE842uzNM8tNbifJnHs3hYJ0wdHDnP6WTebxXFwEAp9QZ/t5Xxdw+UUvKR2oKFtsWAZROiYKiXJtKJJrww/ijY7YTiPBZkK8L1LspnpQvdgrTWJoJhNI4xRofcp9Z6ueHamg/GmMzFBFMBuabz+DSZfijCYGlYA6sMCMKPQUacLptVhHiA51Kl/dZNoDnwyBgzlKMhwee89Q4ff2KN5HVlnvpg3s5HlvEhc2IREYOoba+KYuAyagtmjDED729sXcGvqDH4JgbONXkgGYgI+TJYP5AC48WqogBpM/ZvuRIv6QUwapsusr8pXpwU019aFAEWcQS81FovwgPVZESHEHKaS3iGHj9HtdY7WMRzOZWoQYo4Ee0YMztkTrwUx43WegkOnNTngnj9H2R0F3qslNqSDkKIEHwj1DoDw3IPomB5sH4Q0lNPSMq05aFPLjKAl49E2h5G0IxAXjYPtdZ7SFMihMSBCPY/pehSoq5IvyI1IY4kpDx9TCDFewzvi+3Un9PGGCkilo5CC4gG2MjBHUQFThGLGLBYUbAxWD9IOjWBkAC0lfOZVEtbeHc+tpSLWsQlRAo2kDNLCIkHsT8+4f5sPaUmdRAR/ZJgnWcnntOICHxGfYDwTNqS5nUZik0MWGTy/DVYP9gbrB/MD9YPzlf7GiHdBA+lsvqTUFxKwWMmaUFa6+0EFjG8Du8T1w0hJD7k/vyISAFF+5DIuwLP4YdJDfw0XXhO2+iArFlwFesRZBKrGLBcsiE8pBAxWkD6StsPpKgfiHhpb7QomIZFQtJ/aq1XUNtACImLexTtw4H0mk8JPYfLSPo5bYxZwyJlC1iM7DDvb2MXAy73nGjB0mD9gLl9pE+0LYSjFeJ4SG8n+gKSrhobFASERIk1BnmPloBOdy+jHuTo2Od0inanRAeee4XEp0hJDFguIQ3g02D9YBtpRAzlkc6itW6rF7PLWIxFVXhBbyS+YrmImD0WLxISLddxj7KWwMNJz2y6013TXElREEiNgDEmNz3IkqIYcLGdAL5AGMyxvoB0kFi88jFGB1Y6EpIeS9jzREgfGEMtATuCAccZ05W0oDLsc7pzcyB1MeByBSEqqS9YoTAgXaCltQXyuBlTQR26VXRpRfIxpgwREj0vkRLTa3ooBCxjmANtCIJred2A8O+X836f8feSNnTN/twlMeByE8Jgj4XHJHFim7tRjAeiJPVuFVlQEBASP/f6LAh6LARcGhcERQXA6j9BMNL2uioGLGNO4fFXCAOG4UlKxNbJIpbxdPlFLC/YpQjGQQjJp5eCgELgBEtdSe3suhhwscLgk9ORiIXHJFpaXlsgj9bXHEARX5fSg7K4h8JxQki89FEQLFMIfMNGcpO3JfskBlxsR6Iv7EhEIibW/tZc86AZlpkuREj03OvLWgSo07oZwVBiQgRB8uvF9FUMuLgdiTZYeEwiIlbPcGvjggemLy+jMaYLEZIEf3Y9kofj62KdVh0kn9pJMXCS635HopgGR/pDJGsL5NHmmgN9S525x97mhCTBchfSRbKA17v3HZRKSDq18zsUgpDTHHckcgqPmb9LmiT2+daWGOijQF+MYAyEkGLGsO5JF1lOfGHHpkg2tfMclvEn+djC43uD9YMj3BTLqzcu8LyRIES2tkAe18ULZozZa2qHOC9NFa5twlHyFc9I2bcUTovnb7rhqI2c6yljDJ85hMTNFcmrN8Z0RsDD2x1DauaRY69u49ms8Fw+j2dz6yv1I10oOafVudUbFyQdZj/ilISYGEPh8W84Z+IFWFq9caExg4j0glSiUHMNe62b6GL0VO7pHJHzzeuH1J25BkXbXI8KpwlJmYfSYahJR0lg2sqFP8IzV5wyG1XPJ57Ns/i0Ydfew/VPKuvmHP4rL5m/Wh5LalxyhMEOIgYrFAbBOOpRFCsVr0KXxIDMr+mq3nc86DfQVnApUMTCOhyWvXF9ReQiFCEiMKHvX0ZNusF+Dbnp0xF4iZcxjqRB96Cmz+MOHDIjzQP7bBa7Fm2w51uItC+mdv21Meb4fyQvPoHUhBTYdITB1/QPZzS01qbmTW4aYzpfSIkCtC8RDKUqPzblAcGLKVQ3ix9GTcNB+tJSTc/PI0cAtOJZgmftY82bjeL+7cpzKdA1ejRsekvM5xPPUuslbiPNZeRnYwznFc+1vQZrBUQIzhtjaq+7wFxYangeNPZurINv3YRWb1yYQ4icnA2/IxELj8kwhIoKvMLDtm6ajGKEMrqeniUf3xjz1Rgzh3M8Kh+UUreMMedlW6mFmAmJDUkrEe+yMUbewd+f8f4chdTrBuYaFAIiRCdCCAH131yQeXALDpcmSOr6n2gtunrjgoRTfgwcgu4TokL/YkciMgShjOuVQJ0uZjuwMFYtLfMgCD4M8RV5zv6ilBqXF1WoFyEhfQfG4BxEQVP2zfXE2wI3UaN0BA96I4YznrETSEUKTVLX/9Q6A6s3Lmys3rggB/ADIgVNqaguYzsSiTDYG6wfLA3WD5oohiQJgQdHiPzMIzwEQ/SJHku993/NXXrmSp6Z8hL6XYwSCdvDc9nbdEJCmgSiYBr3YBMkWfTf0Do3O6jTajQKikjuVEORomS6CuUuOiatMyVSsHrjwnmEVobxeJF8bOHxJwiDxcH6QScXKiFDEzIqYI3e1FOFaqfOyAYMe98A2IdjRQSAtAjN61ZECGkAuQfh8Azt7LyZ6EJkoZ/pO8M0bAhBDamdVbiXSuS80grE0n509cYFUYrjCGs3EWLpA5dQEPllsH6wPVg/mB+sH6SeckFGAA+MUB72lZz/r4vria+8Wet5RxeMHbxofkAu7DwFACHxAEN0ugFBkJSzBO+ikIW2tnNb6xHRhgRBEpHzSmLAIt1xVm9ckAW3ppB79zSQp7GPSCu/P6V6H9ECioJ+MRuoWOvIy0UPtaR8ytGBxbq9N4gAzHGhMELipSFBkNqzMbTxGoUQcJBIbkgHd/fEgIv000ca0QSKjl+xvqAWxhAtkEhB51tpkm8ETRGyJJ4qFCq39BLWDKAAJ6Rn4JkY0mC7hH73qRDyXPwem4MEwmQ2oP16M4V3y8hiwAVFx3Oo0v6F9QW1IAbKx8H6QdL52KQcpNhcD3SqstKCQqQKXUq8c4ZE5vZkLQOKAkL6BYpYHwU86JSejaHGuolajehACmfIjkbRX/9axIDFSSOyfX1/ZxrRmXlJQdB5Ql3f/Zx2lammCoXuOmGjciIKltFRgxDSA9DeMpS9ksSzBBGMUGsLRN1ZCUIl1PXvlxhwQRrREtKI2Kb0bFAQdJtGUoQsAVOFQq850FR4+VsrYFkJVGstKURLWuu5xKMfhJBiQj2LQ0V+6ybU8+1VIvVToaID0aeJnWtiJ9KmFKpwHgtvzbW0PHjKyNoEko7V144kU2KURTCOU5xl+fyAawuokgjAClrc1oldcyBI5EFyO7XWO0jpaZLr7stca61QcLaNzwYLhQlJH0kX0lpvhjDexeuewHMilNEaZXqQj3SCk1TRAO/k6MVgI2LARdqUiiGCbjmzEAlNv9xTZAw3VF9TF8YS8q4MQ8gUoaIXz3IAMaBwP4dKQ1LY9p8Bt1+VK/hIBEFe9EcQWCJYV7iQGCHJshzoXTPVYHRzVEK0iN5JzFmyFOIdE7sYDJYmVAbblI7ETXYY6g4Nri1wioCpQlcCrzkQovi5Dmxq0Uul1KHWeoU1B4SkB9YJCZHSnMJaLCFEUEjnUAhCvWOibkzRmhhwYZvSoWDtQHcItbaAqvgADvXQC1Yohq4PKXQru4maA3YoIiQ9Qjwbo3bkBXxGRZnemwfeMSEcZVFf/yjEgAvblJZCb2N3aCtFyBLKYxN6jiaRfwouOR2KKAoISYOkDNiaCFEvcJRoPVXvrn90YsDCNqW5jDFVKH0Cry1QycgPmCp0KWSKDHqCp+YkcNuWMrpHSNyEMAa7WPNWRqqNFUKMO+qOQtGKARe2KT0FxUD6hDQIh/H4h0oVCh0dmE/0GSCi4CXalaaQQ0xI70CqSN8I8TyiGPgP1gzUibQpRX2BnNhbqC8gJDVCiYGdIV9koVKF7oVMiWlgxcjQiJdwm1ECQqJlp2eXJoQYSLWrWu/EYHJiwEXalKK+YBz1BX27eUmCtLi2wCkCpgqp0NEBrBiZsjPARglS67ZBSB+o3ZDtYTQwSTHQx8hQ0mLAktGm9BHrC0jEhPQGj5L2k1xXIW8fqTsBJIqyzeJiQjpP38QAF2NMhE6IARfUFyyyTSmJkcBrCwybImQJ1Z0n9JoDCot7TXdAEMgCZhsUBIQQQpqmc2LAxbYpRX0B25SSGGh7bYFTQECEMqaDRwcoCAghhJDR6bQYcMloU8r6AtIGsaUIWVJdc+AYRxCkLvivJLhiJyGkGn3LRWfnw0TojRiwOG1Kp9imlDRJ4LUFNs9Y9BSqbiDomgMuIgiMMbOoGUqZm7JAWeLHQAjx6GnL0uTQWke9JkAIzp1lm69vv5iA8ptyPqFSIIblCAbO0t339zOLWKRNKdIY5gfrB7PwYt6LZPyke8SytsAp5CWltd6BZ7puZgOKjaxjkZV+N3BOQnVtCs1DrfVKoqt3EtIF+rZIWIhnTaoF071L1RxaDLy+/WIKRs1s5C/aMRj2917ffrGPIsmVu+/vZypzaVMqvx+sH8zj2OYDGUakv8SaImQR4/nPeoZzAumWM49UnkaQVYrh3ZnHJxYnxTAsx75qJSFdpKcLAoZ4Pqd6HkOkN0Xt2KmcJvT69ovp17dfiLftk1Lqt8Q8bpdg5Hx5ffvFyuvbL3KNMrYpJSEIvLbAh5oM7ZDe+8YX10La0CIM6hTXI5BuTE20ZyWEnCSECO9jnWKq0ZUQ1z/qNRdKIwNIBVruUMjspnxe336xVCGNyK5yujhYP5h2IiIpehlJu4Q0hiXH3ER+fecCtjAtBHm6c8jDn0ssUiApT8tNRlUIIUEaH0R9DyOaWvt2xREm2659w2EJIQairhcpjAzAg77d0dw5m0b06fXtF3uvb7+Yh/DJhG1KyagEXlsgFa60XZQlokAiBcaYlO7hMc4dQhonxD2XQv1PiGYqST2/8J4KEcVPUwzAc/6yJ17wymlEim1KyfAwmvQvjacK5WGMWUbnoXGl1C2kEcWaDshUoXhpKye6jzntjYDuZyGe1yl0EgohWFJzZoR6T0UtBjPThF7ffrHc4646w6YRyd8tDdYPbGH1HA2/IBwlvLR5NEZwy8zFZtgi/WbF1kugcNB2R7Od0tq+n49XcmZbwihpq3aOYiAcoZ5RKby/QmSCHLeXNsY01lHujIR4X+/Hnup5SgzAK872msN3I2Kb0rBsG2OSW8Ak8NoCqTEW+0sBBveeX0yNAnBXJDRtBM62VXNBipG0ghZawLLLVABwnwd5XieSNx9qHs832V56VLTWoZy50QvBE2lCaBv6sr3hRMuwaUQrUl+AFIRfmEbUaxgVOEmS50Ne5MaYJWPMnDFmooUUQdYN1EOInOg2DPPeFTg2RKjF/jajO9JsQgmW6xBasRPq+kcvBP2aAXqeypE0opevb7/4KulUEFCZsE0poRg4xU0UVCcNipFFHMi9/WMDL3t6gushhIeuUSOnrwWOoUEb31BR3CS66SAyGspGidq+RLe5UBHfdMQAvN1MZ6jOsN2I9lZvXFhcvXFhAsbDq0BeKhIJgdcWSJlOCSREDaYh9kMx1gURFQEh8nZnG742oe6f3ooBCKxQXmGVQoqMQ6ixXoHBHR24/g8DjesohZXk3cgAO1aMzrBpRGxT2g8YFcim1fMiIk1699e9XSxwFlIQMDpwdkK8lMcantNB9tXXAnUIuZWAjQL2UzAGHUJ6sR+23WLaB9e/9veBQxJC8FgMINXlSvvD6QSV04gU25R2Fq4tUEgraw5ABMiL7qNE9VAsVisQBEwFjJdQRtliE9EBeFZDGK2p5LTXCq7ZRuAIbkpRAYUGDyGzFjbQWCMWJH0ppP2bjhigBzMIo6QRLaG+4Ael1FOmESUN1xYoprFnjicC3FTIpUAGXGqrbfaJUGJgLHCaie1M1ue2l7XiCIHQjtAUazFDGrByr6zEkPaICHHIro/7qbRUtWIguZaNieGnERV6jKVN6eqNC/NII7ILIpG0oMAuJvj5Ec+/1novQwRYQhlw7MoSKYELJH8LEW1SzaSy9EoMIDK514AQ2Ew0/Sq0gLnSdoSgASGgAqcf1YoVA0wRag5JI/oLaURLFdKI2KY0Mbi2QCXGsNJn7Tgi4GWF8H8IA47OlbgJ6al7Wfd8asiDnVQqy1lAqtWnhiK3SXZoRI1D6NQxmc/bTaeMyv2ESHET60AlIwbOvb79gi+udpAH0W/yeX37xQ4mzfLd9/czu11Im1L7Nz04N6nDWoFqzNVlhMBgsiscD5v/KwacvADPfG9RCCbBBp69oahzPjUhBHZiXx21DiDSQraP9EkmRSSHpQaeZWIHfdJaP0K9VVDQ4W+5oTnwKqWokEQG2K6ufa4gjeiwShoRiR525qrGzbOGieHlWUTI/88zPOTr8uhSrEdOAwWSCvNp5SzzG/OxiVSWzs5ZOf+yfsAQkcI6Sfo9gPukqWYI0mVoO9TCZJgHy0gZbWoORNlGNY/v2K4uOoZKIyJxEXBBoK4ykvD1RMDDmkL+IxtwGM9KYE8aaxHqowkDWJ7lX8QIqZoKgXnkprk1kcrSCTGARgHTOH/SHEBSXb6c0UkwKpuJRwUsTQoaEb0fJYWnrhRSRwR8aSgtyJJUVEDQr279bzHgYgukHkrTiGJDa21qHtImFnaK/bibKErqEhJKr2x8w1BfDHyOjxAiX67yQIcHdym04WaM0SG3b4F37mPNm43q/sU8+tLwbvdRqGuLdSX9ZwKf83DMNZ1iJkbLyBGxAM/5rvDDWdYWiOn9ifz6NlIf95FGKvvfqJrKBuE9jbTRtuphv6cYIKH5cPf9/ejTiHosBr6ypejQlL44GxIBWezgZbTnGHHWcLMvnSaud2Pzvw9iQLVr5MREbEZrF3hqjDmTRz0yMTCFguu22Xeew74wsMcWw/3cSP1D3ZxLbcDkOPRMIgQeYgqB4Zmv0Gp0oqWIy5VIuq1x7YL6WQwgelJiM7GVcVNgP7Vc8TJkjkiBbwRO40v4xCzgd1IUAopigJBaCRmx2W957YLZgB1YSs+bMUbySDd77MntTevHpsCc+tBjBwvXQqmf2S52ZhIDF3n8bENfTLL3FMUAITWANJaQRsWSGC9tXSsUNIYSA7LmwFyFVox99eTu04MbjPkGU71i4mmii2HFzC8dv0/nEKFk9DubRylf/+8q/A0hpJzQdRyteoZhOHwIuItK0YGersad5MJFKYB53bfze9S1VJYIeFXHuhIxA0OXbbOz+ZBqepAlxcjAB6jT464MqXTXIZ0n5ENyJxIv3krA6MfxmgMVjnMewqEv3qkjrl0Qlh6mQHQylaVFPpylI1NKiOBBgwF2zPuPnS6k3KUiBjbxQlyh8U9io4G1BWIxBlfQ+zwUs2VeWjFiYLj1JV1oiYZbI8zCwdR1kfm0zXTDDtIJQ3AYRPhgZWw2M/nXWTPXhWd07GJAbrT5u+/v8+FFYiZ06DSK4lEY4iELLuerpGyg8PN3LCbUZZLtTJEaEpHqgcjcPGvLS3ICsU+meyrWbf1AnwuKj3D9O1EnEnPNwKO77+9PUQiQBAhZLxBLipAlpDC5VHWlVmPMUg/qB9jtpUHgMf+lo4e300BdU5/Y7LEQUDjuacyrPtIpIaAiFgO/3H1/nx4xEj0NrC0QW7546ChFZc8l8nS7Kgi63pkkSlAE+qhjh7XfZ8M1AFIs3Pvz2WNB0DkhoCIVAyIEWDBHUiG0ty2qewEvgFa7Crl0VBB0vjNJzCA162lHDmeHBcO18ntfioWrIPPKGDPVoy5v+10UAipCMfCUQoCkQgNrC3yI9CUeMjowhmhLZfBy7oo39xWNjfZBbn3qKUM7XTVcWkC8wT8iPZF44JnVFQGdh9xPU129n2ISA+x9TFKj02sLFBB6XEMbw/Dm3sJzJFUoBCIC0ZlfEp1Tvc5prxmJhE6wC1MxENCpP4PzkGfzVJfvp5jEwBLbhpLE6EUXIZ8GUoWuI+oy7LjkfE3BEEoNph9ECARBannRj5jTXguSEnLLGMM0q4o4z+Cu1BEcYQ50/tn8HdpDxQDTg0gyNLC2QKwpQpboogMKLSLFEBLjOhEPlRgcPzD9IF6QFjCdQBrEPlJZGGE/G0cQVBMwbskQ4Bk81YHUTRsR6sUciCUysHP3/f2Y2icSUkYvowIOUYoBC4zricgNuKddzkHtEiiUlHv+RxjdsfEIc4mpLKOzj/M4QUF1dnAOv08wUtvLiFAsYoAPMJIafa0XOKaBVKFLWPZ+ZBwD7vvIul1sIhowz/SDtBBjWzzGqCWIQRTIvP5eDC/OpZH5AONvguexXpxI7Y8JiIIjpGv2MiIUixjgzUeSoYG1BWJPEbJEHR2w4IUk2xqH568tI+4V0jjY4SVxpJbAEQVN50cfOSJgLrJFCVPAnj+5duPwADMdKCAQ0VYUhHQijYK8D35BRKi36ZrnIhgDIanRq7UFCpAX6MuA25/VWp+vSxhhOxK6XkTNxxyuZcjajx1cz2V6HLsHCoyXG5pPH3DPrXAuVcZ6oyX7QETTBsVTeyCNbQMNIuYbeP7mcYR7aZmpdf+iX936n6i1jy2P49bd9/epzAkhjYMX0zS6YMjn+ohjkBfMNj4bMDxotPUMCAN3Pl0Z4QwcOfNom3OJdBVHSE+PeK9UZR/30wojQaeJJTLAhxwhpBXgKTwRjZGIBAw5hULkrFan2/bZRe8SsSAF7EQaGAye8/gxqxZmDx9hm4Y/6Qu4X44bcjjPXSumz4/onNnBs9mK6W1GhIphmhAhhHjAGKOBT2rBqxHhvCIkA+e5e+oe8QR13vd5b40IxQAhhBBCCIkWNl0IS0wrEBNCCCGEEEIahGKAEEIIIYSQnkIxQAghhBBCSE+hGCCEEEIIIaSnUAwQQgghhBDSUygGCCGEEEII6SkUA4QQQgghhPQUigFCCCGEEEJ6CsUAIYQQQgghPYVigBBCCCGEkJ5CMUAIIYSQJNFaT/b9ymmtx+UTwVBIolAMEEIIISQ5IAR2tdYPen713iilnkUwDpIoUYiBu+/vb0QwDEIIIWRktNZ/a60fV/2+/K18h2d8ZK7ii2t2AyEjBRF74OWYP0cwjlap49r3NdLEyAAhhBBSD1tKqQdVDEZ4sxeUUk947kfm2Ag2xhwbwhBiEim4U/eOcE13lVKr3r/f0VrvtiUSYLz2QgwUnWtc891hxHjGNjLnj9Z6QWu9mv/N9KEYIIQQQurBGvaFaSsw4MTweG6MectzPzJyHg+dLx/CKN4KtL/PbhQCHEcnjDGHeV8KzKnoSIcpOtefnc+o5M2fO10XW+ciGAMhhBCSPOKh1lpvwRJG3tQAAAuHSURBVHgo8vi/gUf7V171MzHjGsHGmCehIi0wQK9l/Kptr7wVRG2JkSbJPdfGGLnvLp9lLAXzZ5xigBBCCCFVEWNiVVINsrz+WutnMGpOGZZIf7jjeHuPvZTGmFyvr0QZbJpMld/bFAsxbvH/si/5m+fud2BoC4ejRC8qjOvbOHLGZVM1tmDoZX3/hJGWcayTTgrRDM77W9+zjG3Z413L8jxnjNfmlsv5W3Nzzf3jHuW6Ot+137OpMWve9ZjENaosBoYdj3ce7dw4dV28sR7ibwrnTsVrXXqus65P0fxzvjPuHpu3PfuZ9MZx6MzT0qgQvjfUNWoapgkRQgghNQGDaisrVQh1AvL5I8NgXEBO+mMYWzOoKRBhsZpV2Ijv/J2Xr661vooc6Bnnn/9GXcOCkwO/4HznGf7mGcbyBoXRV7P2UbLfotz9v71zZMf1DON6ho/s+03G9ydhqG2pk52F7qiTOeQPUKS9iu3tYh92rI+xvzf4+OfL8tjWC+A67uIzieOwP++618o5z88yrmvWcdnvzWDcb2As2+/a63HCQC67JhnjqTTPnDk2g7x5eyxXnb/JGuudjLG62x3Pudar3vmreq7/tvPYfqdCMfC3Lkz+/MH52cV23Z/df/u7rIuTnYeO2IwSigFCCCGkXsQbOuMalV6dwHN3bzAKbTHxZWPM8QdpD7/CCMoSBGUeR9fz6xabPnBSma7ZKAUMY/n3P7Bv+Qzg5X0zRKcVu9/M3H1nHIfq9Ljkvz87+/8V59I3nE8cW8Y+7Vgf43rY7ckx30FR6BsYaXZ/12BYZx3rVWfbaxiXTSn5Az8ffxzv8jNcV7ne1zKua9ZxWQP8DY7t2/fw3Wv4dzsfKqewjDjP7P/b8fyM7z7PGOvAG+sA4/MN/HEY0jPeXPvZGcO3SEjZuc6IEtnrlGuAQzBcxfZUxvx5jn28xXZ/dT5/OH+bK5IxrseIRkVdG8Q0IUIIIaRensPouuN4bTPrBGCAHxukfpoGjPznWus1GE+PYTBZyrzCJ7rtuAaPMcbdjjVcxEB64omVNdRB7NqoRoUz5e/Xxy96zR0Xjl/++0zElXOO/H1k/axgMLqG2BMYpgsQI9dcMaW1/tU/VpybSRiGNjXlOQzKQwg8P/XIXv+i6/oZwuOBY1xbT/0T5LAr77tyLX6GYf+mas0CxlN1ni3A8HWvzanvVRirzJ2BE32y27QRoYE3R2zNzd/OXCw9105q0pY9Rzi3mYa6Z6S74vHb/MG/byHKdegLeLAFYZmXkrSAcVW5Z1qFkQFCCCGkRmCsWA/0OAz+Sc+Qtx5xmzaUa9TD0HgCT/K4OmmgFhmCV73fW2/8UIXLzvFUxd+vj1/0ag33vH28xd+6xp1/7H5noasZ+fWWLRhppwxL/PzWyWNXTu64f0xXsyIzjtgou642pczd12OIorLz/Ydz3gq7JznjeVJhnv3spF7ZOfY853vWoM4dqzXm7b2g/ivU9YWA+/dbzrFZMs81mHQ6AVlyxQDGrTwj3Z8/lpmC87vm/M0JnHv7SVntQgxQDBBCCCH1Y43QZ45h6BsFDwq8jj5rMEit4ZFnoLpMeoaM9X6eMnrwb7KPBaTQjHu/F6OmqofT32/W791xTOYVjzpjO3SKaJWXtqNco80xYsty6fNSN8Y9w9Cec398ecc57HW1BaozOK5S4YW5dFgSgbFYsVE6HjH6nXGPux53F6dYuMoxbjnbcsd/CidlzKdoTmUJhWNB4c9jePrv4H70r7FfEF14j2G+5omOZ7g2SawjwjQhQgghpGaQy7wGw+NUnQCYGaL40xou1rjJM1CPyVmMqnB/kqLj5LkvIGXjbUWjtmi/Pv44CsflbzPjZ99oLRNK4xXSmNYq/P1kjjE8o/6rGSjDNXyv2i48Fb5nqdKhZiavS1KF76mc8dixPkAaVxFZi4RN4t6Y9Dzr9nxUPdcqR/hZAeJfSxt5cbtn5YmeyTwx5PDZjwwgpWnGjwTGDCMDhBBCSBjWYDDledSHWbXW/m1ejrzPiRSSMi+nBTUN1+CdHkeufmZHmBzKiodPjKPiuPx0mKyf3W0UCqWClJA8w/BU2pNfBO3hRxaK+OwYuaO0oKwiHHKPt4Qi0TTM3D1002VshyKITmvIr+E82HvlRIvYkmPIEp/2vLhdj/yiYff7eWlgqmRuHkfsvPS9hRSKhl1iiAzsRDAGQgghpG6K8pxVRupLETOe17hKvcChJx4qdZ5xahSeIHXlGYpVsxbd8snK33bxx1FlXP6xZP2snJ/LPP9FkYis8WQVapet/Ls1wqJyn61hWbF3fZnX2jLMPHO5WiIiDoc9RqTp2A5LTzLqLb6tOeCNQ2Wd6zyhgMjctxSenKJhf/tZ0YiyNCwbgZhB2tnjVIqGXWKIDOxFMAZCCCGkbspy59fcouA8nE4/7oJZZUW6vhDJ9diLgSbdabLGgcJRMfiu5vTf9ynzbvte+8JIAvC3mfWz3zUpLye9LBLht2MtSiHJW/l3zS2YzQPF5QvOr61hWbQ+g2WhqrgbZp5hHrhrGORdF5uTXzonvBoUW0/h5+xbZjIM8KJzXSTK1pzfZxUNu9vPSwMrO79btrjdqUdIomjYJQYxsBHBGAghhJC6KRMDNj1koWS/NvfcLUbM7XHurBLrGkhFXs5DZ/GpLPwUpSKsdzsvrehOSUvQLHzPvP+zb7QVCaUyj/rVjPFlGd1FouctvlPluj6w58rpLrRQlJbltC1VFa/JMPPM9aQXiQ3b4alwmxjrQlE/fudv7WJl/jktOtdFQuEzBMuDnKJhdxtZx1kmuG1xu60beJxS0bALxQAhhBBSMxXynN10nAV4ZN38ZjGo72Bl1xl3MSvwFt7IZ/DsT+LzAPnYviGXOxZvHM+woqy7PZteUcXw/NZFyduOXaU2q91p7nZzWqhmpfH4tRFFxr4qEQt+ikpWUa/1jD/GKse+Uf+Hcz796/qg4Lr+6izU9cD15uM62wLvrYqdhLKub5V5Vpi+BSP4Z8zBVT9C4KxY7Lc0fYvz5s9bu3iZGuZcF3XIcgTjqaJhj7wIyJqzQN0D3AtZ2I5QM0O24I2GtmsG9u++v78d0fkghBBC6qAsp/wY8SJqrQ9hsNxBnrNyOuKsYWGsz9733mqt/4Cx5Ropdk2Ax1l990vGoXK297ZqbjhytX/G/le97TyvmI/v4hcc561eXLUGoUrhtVv4mVn3IYalUyxqDfZrzu9PnM+M6/oWC3n511UWuroGw1gM/8eYH3Zsa9jP42G6DlUYjz/PStO3sKjYt2vtbFM5omrg5ujjO1nzdgvi4o2/z5JzXVT/8dm5BzJz+Iu6X8mc9/b7Oaej0Wd7TVMqGnbRr279b1op9bGl/T+6+/7+Ykv7JoQQQoJRsDLpKWB02D7z1vBYy+u9b3G+ZzvYHLeQ9PftLPhUVpjqbk95dQpDAW/xpLsdfxxVxpVxLEP9nHF8ufvzi3er/L09V1n7xO/veOlJuWsqeN+182HS/17V61kwHjdCkjnPhpy/9hitYb1VtMCZN8/c4yq7difOdcXrM9T8KthvZqoSVoOeyRLtqdC2GBi/+/7+1/ROGyGEEEII6TMQbKuoR0gyRUi1XDPwikKAEEIIIYQkiq1HSFYIqBZrBo6UUvMt7ZsQQgghhJCRQdHz1ZRWGs6jrcjAIqMChBBCCCEkUaRO4nmqRcMubUQGPtx9f3+phf0SQgghhBByZowxVVbkToKmIwM7Sqm5RM8VIYQQQgghnaJJMSBCYJrpQYQQQgghhMRBU2Jgk0KAEEIIIYSQuGiiZoALixFCCCGEEBIhIcWARAPm7r6/v8cLTwghhBBCSHzULQZk/YBlpdQSRQAhhBBCCCFxc1YxIN5/qQPYkM/d9/e3eb0JIYQQQghJA22M4aUihBBCCCGkh7S1AjEhhBBCCCGkTZRS/weWJaC/jJNewAAAAABJRU5ErkJggg==",
  COMPANY_LOGO_URL: "", // built by getConfig_ from COMPANY_LOGO_FILE_ID
  COMPANY_ADDRESS: "Jl. Madura, Kebun Lada<br>Perumahan Grand Sentosa Residences",
  COMPANY_PHONE:   "+62 821-7418-1369",
  COMPANY_EMAIL:   "fastudioindonesia@gmail.com",
  PAYMENT_NOTE:    "Pembayaran melalui transfer bank ke rekening BCA/Mandiri a.n Zulkarnaini Farras",
  PDP_POLICY_VERSION: "2026-08"
};

// Guard agar inisialisasi/migrasi sheet hanya jalan sekali per eksekusi (per request).
var _SHEETS_LEADS_READY = false;
var _SHEETS_PAYMENT_READY = false;
var _CONFIG_RESOLVED = false;
var _USER_MEMO = {};
// Cache katalog folder Ops per-eksekusi — sheet DriveAssets bisa dibaca berkali-kali per request.
var _OPS_FOLDER_CATALOG_CACHE = null;
var _PROJECT_DRIVE_URL_MAP_CACHE = null;
var _SKIP_AUTO_TIDY = false;

// === CacheService layer ===
// Baca sheet Spreadsheet itu lambat (~1-3s per sheet). CacheService menyimpan hasil JSON
// di memori Google selama beberapa menit — baca cache ~50ms. Invalidasi dipanggil saat
// data berubah (save progress, approve, reject, submit payment, dll), jadi TTL boleh panjang.
// Tombol Sync/Refresh memakai endpoint *Fresh yang melewati cache.
// 6 jam (maksimum CacheService). Cache dibuang eksplisit setiap ada operasi tulis,
// jadi TTL panjang tidak bikin data basi — justru menjaga login tetap instan.
// Edit manual langsung di Spreadsheet baru terlihat setelah tombol Sync/Refresh.
var _CACHE_TTL = 21600;

function getCache_(key) {
  try {
    var raw = CacheService.getScriptCache().get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

// CacheService: 100KB per key. putAll() juga membatasi TOTAL semua value ~100KB
// dalam satu panggilan — jadi payload yang di-chunk TIDAK boleh di-putAll sekaligus,
// atau cache gagal diam-diam dan setiap login rebuild dari spreadsheet.
function putCache_(key, data) {
  try {
    var json = JSON.stringify(data);
    var cache = CacheService.getScriptCache();
    var CHUNK = 90000;
    if (json.length <= CHUNK) {
      cache.put(key, json, _CACHE_TTL);
      cache.remove(key + ":chunks");
      return;
    }
    var chunks = Math.ceil(json.length / CHUNK);
    cache.put(key + ":chunks", String(chunks), _CACHE_TTL);
    for (var i = 0; i < chunks; i++) {
      cache.put(key + ":c" + i, json.substring(i * CHUNK, (i + 1) * CHUNK), _CACHE_TTL);
    }
    cache.put(key, "", _CACHE_TTL); // sentinel: string kosong = data terpecah
  } catch (e) { Logger.log("putCache_ error: " + e.message); }
}

function getCacheLarge_(key) {
  try {
    var cache = CacheService.getScriptCache();
    var raw = cache.get(key);
    if (raw === null) return null;
    if (raw !== "") return JSON.parse(raw);
    // chunked
    var chunks = Number(cache.get(key + ":chunks") || 0);
    if (!chunks) return null;
    var keys = [];
    for (var i = 0; i < chunks; i++) keys.push(key + ":c" + i);
    var parts = cache.getAll(keys);
    var json = "";
    for (var j = 0; j < chunks; j++) {
      var part = parts[key + ":c" + j];
      if (part === undefined || part === null) return null; // chunk expired
      json += part;
    }
    return JSON.parse(json);
  } catch (e) { return null; }
}

function invalidateCache_(/* ...keys */) {
  try {
    var cache = CacheService.getScriptCache();
    var keys = Array.prototype.slice.call(arguments);
    // Juga hapus chunk terkait
    var allKeys = [];
    keys.forEach(function(k) {
      allKeys.push(k, k + ":chunks");
      for (var i = 0; i < 20; i++) allKeys.push(k + ":c" + i);
    });
    cache.removeAll(allKeys);
  } catch (e) {}
}

var CACHE_KEY_OPERATION = "opsData_v1";
var CACHE_KEY_APPROVALS = "approvalsData_v1";
var CACHE_KEY_PRODOPS = "prodOpsData_v1";

var CACHE_KEY_CLIENT_PORTAL_INDEX = "clientPortalKeys_v1";
var CACHE_KEY_BACKFILL_DONE = "leadsBackfillDone_v1";
var CACHE_KEY_SHOOTING_CALENDAR = "shootingCalendar_v1";

// Kapasitas shooting per hari. 1 = satu hari hanya untuk satu project.
var SHOOTING_DAILY_CAPACITY_ = 1;
// Tanggal tetap dipegang project walau statusnya batal/ditolak. Pelepasan hanya lewat
// aksi officer di internal system (releaseShootingSchedule), bukan otomatis dari status.

// === Schema guard ===
// Migrasi/ensure sheet (tambah kolom, buat sheet, repair data) makan belasan detik dan
// sebelumnya jalan di SETIAP eksekusi dingin. Globals di Apps Script reset tiap request,
// jadi penandanya disimpan di CacheService supaya cukup jalan sekali per periode.
// PENTING: naikkan SCHEMA_GUARD_VERSION_ setiap menambah sheet/kolom baru di kode,
// atau jalankan resetSchemaGuards_() dari editor Apps Script.
var SCHEMA_GUARD_VERSION_ = "v3";
var SCHEMA_GUARD_TTL_ = 21600; // 6 jam (maksimum CacheService)
var _SCHEMA_GUARD_MEM_ = {};

function schemaGuardKey_(name) {
  return "schemaReady_" + SCHEMA_GUARD_VERSION_ + "_" + name;
}

function isSchemaTaskDone_(name) {
  if (_SCHEMA_GUARD_MEM_[name]) return true;
  try {
    if (CacheService.getScriptCache().get(schemaGuardKey_(name)) === "1") {
      _SCHEMA_GUARD_MEM_[name] = true;
      return true;
    }
  } catch (e) {}
  return false;
}

function markSchemaTaskDone_(name) {
  _SCHEMA_GUARD_MEM_[name] = true;
  try {
    CacheService.getScriptCache().put(schemaGuardKey_(name), "1", SCHEMA_GUARD_TTL_);
  } catch (e) {}
}

/** Paksa semua migrasi jalan lagi pada request berikutnya. Jalankan dari editor Apps Script (bukan via google.script.run). */
function resetSchemaGuards_() {
  _SCHEMA_GUARD_MEM_ = {};
  _SHEETS_LEADS_READY = false;
  _SHEETS_PAYMENT_READY = false;
  try {
    var cache = CacheService.getScriptCache();
    cache.removeAll([
      schemaGuardKey_("leadsSchema"),
      schemaGuardKey_("paymentSchema"),
      CACHE_KEY_BACKFILL_DONE
    ]);
  } catch (e) {}
  invalidateAllDataCaches_();
  return { success: true, message: "Schema guard direset. Migrasi akan jalan lagi." };
}

// Buang semua cache data — dipanggil setelah setiap operasi tulis (save, approve, reject, dll).
function invalidateAllDataCaches_() {
  invalidateCache_(CACHE_KEY_OPERATION, CACHE_KEY_APPROVALS, CACHE_KEY_PRODOPS, CACHE_KEY_SHOOTING_CALENDAR);
  invalidateClientPortalCaches_();
  // Jangan buang CACHE_KEY_BACKFILL_DONE di sini. Booking baru sudah menulis
  // baris Leads sendiri; memaksa backfill di setiap load dashboard hanya
  // menambahkan 2× baca sheet penuh + migrasi kolom.
}

// Update satu lead di dalam payload yang sudah tercache, alih-alih membuang seluruh cache.
// Tanpa ini, satu perubahan status memaksa pembacaan ulang semua sheet (lambat) pada
// permintaan berikutnya.
function patchCachedLeadFields_(cacheKey, projectId, fields) {
  var cached = getCacheLarge_(cacheKey);
  if (!cached || !cached.success || !cached.leads) return false;
  var pid = normalizeProjectId_(projectId);
  var changed = false;
  cached.leads.forEach(function(lead) {
    if (normalizeProjectId_(lead.id || lead.projectid) !== pid) return;
    Object.keys(fields).forEach(function(key) {
      if (fields[key] !== undefined && fields[key] !== null && fields[key] !== "") lead[key] = fields[key];
    });
    changed = true;
  });
  if (!changed) return false;
  cached.syncTimestamp = new Date().toISOString();
  putCache_(cacheKey, cached);
  return true;
}

function patchLeadStatusInCaches_(projectId, newStatus, folderUrl) {
  var fields = { status: newStatus };
  if (folderUrl) fields.driveurl = folderUrl;
  var opsPatched = patchCachedLeadFields_(CACHE_KEY_OPERATION, projectId, fields);
  var prodPatched = patchCachedLeadFields_(CACHE_KEY_PRODOPS, projectId, fields);
  // Portal client menampilkan status juga, dan lead baru mungkin belum ada di cache.
  invalidateClientPortalCaches_();
  if (!opsPatched && !prodPatched) invalidateAllDataCaches_();
}

function getClientPortalCacheKey_(email) {
  return "clientPortal_v2_" + Utilities.base64EncodeWebSafe(String(email || "").trim().toLowerCase());
}

// Key portal dibuat per email, jadi daftarnya disimpan supaya bisa di-invalidate serentak.
function rememberClientPortalCacheKey_(email) {
  try {
    var cache = CacheService.getScriptCache();
    var raw = cache.get(CACHE_KEY_CLIENT_PORTAL_INDEX) || "";
    var keys = raw ? raw.split(",").filter(Boolean) : [];
    var key = getClientPortalCacheKey_(email);
    if (keys.indexOf(key) < 0) keys.push(key);
    if (keys.length > 200) keys = keys.slice(-200);
    cache.put(CACHE_KEY_CLIENT_PORTAL_INDEX, keys.join(","), 21600);
  } catch (e) {}
}

function invalidateClientPortalCaches_() {
  try {
    var cache = CacheService.getScriptCache();
    var raw = cache.get(CACHE_KEY_CLIENT_PORTAL_INDEX) || "";
    if (!raw) return;
    raw.split(",").filter(Boolean).forEach(function(key) {
      invalidateCache_(key);
    });
  } catch (e) {}
}

function getConfig_(key) {
  if (!_CONFIG_RESOLVED) {
    _CONFIG_RESOLVED = true;
    try {
      var props = PropertiesService.getScriptProperties();
      ["SHEET_ID", "DRIVE_FOLDER_ID", "COMPANY_LOGO_FILE_ID", "RECAPTCHA_SITE_KEY", "RECAPTCHA_SECRET_KEY"].forEach(function(configKey) {
        var value = props.getProperty(configKey);
        if (!value && SENSITIVE_IDS_[configKey]) {
          value = SENSITIVE_IDS_[configKey];
          // Jangan persist secret dari source. Secret hanya Script Properties.
          if (configKey !== "RECAPTCHA_SECRET_KEY") {
            try { props.setProperty(configKey, value); } catch (setErr) {}
          }
        }
        if (value) CONFIG[configKey] = value;
      });
      if (CONFIG.COMPANY_LOGO_FILE_ID) {
        CONFIG.COMPANY_LOGO_URL =
          "https://drive.google.com/thumbnail?id=" + CONFIG.COMPANY_LOGO_FILE_ID + "&sz=w320";
      }
      if (!CONFIG.SHEET_ID) {
        Logger.log("CRITICAL: SHEET_ID kosong. Isi Script Property SHEET_ID.");
      }
      if (!CONFIG.RECAPTCHA_SECRET_KEY && CONFIG.RECAPTCHA_SITE_KEY) {
        Logger.log("WARNING: RECAPTCHA_SECRET_KEY kosong di Script Properties — captcha dinonaktifkan.");
      }
    } catch (err) {
      Logger.log("Gagal memuat Script Properties: " + err.message);
      ["SHEET_ID", "DRIVE_FOLDER_ID", "COMPANY_LOGO_FILE_ID", "RECAPTCHA_SITE_KEY", "RECAPTCHA_SECRET_KEY"].forEach(function(configKey) {
        if (!CONFIG[configKey] && SENSITIVE_IDS_[configKey]) {
          CONFIG[configKey] = SENSITIVE_IDS_[configKey];
        }
      });
      if (CONFIG.COMPANY_LOGO_FILE_ID && !CONFIG.COMPANY_LOGO_URL) {
        CONFIG.COMPANY_LOGO_URL =
          "https://drive.google.com/thumbnail?id=" + CONFIG.COMPANY_LOGO_FILE_ID + "&sz=w320";
      }
    }
  }
  return CONFIG[key];
}

var _PASSWORD_SALT_MEMO_ = "";

function getOrCreatePasswordSalt_() {
  if (_PASSWORD_SALT_MEMO_) return _PASSWORD_SALT_MEMO_;
  var props = PropertiesService.getScriptProperties();
  var salt = props.getProperty("PASSWORD_SALT");
  if (!salt) {
    salt = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty("PASSWORD_SALT", salt);
  }
  _PASSWORD_SALT_MEMO_ = salt;
  return salt;
}

function generateSecureToken_(length) {
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  var size = Math.max(8, Number(length) || 16);
  var token = "";
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    Utilities.getUuid() + ":" + Utilities.getUuid() + ":" + String(new Date().getTime()),
    Utilities.Charset.UTF_8
  );
  var digestIdx = 0;
  while (token.length < size) {
    if (digestIdx >= digest.length) {
      digest = Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        Utilities.getUuid() + ":" + String(token.length) + ":" + String(new Date().getTime()),
        Utilities.Charset.UTF_8
      );
      digestIdx = 0;
    }
    var b = digest[digestIdx++];
    if (b < 0) b += 256;
    // Tolak modulo bias ringan: skip nilai di atas kelipatan chars.length.
    if (b >= 256 - (256 % chars.length)) continue;
    token += chars.charAt(b % chars.length);
  }
  return token;
}

function generateNumericOtp_(digits) {
  digits = Math.max(4, Math.min(8, Number(digits) || 6));
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    Utilities.getUuid() + ":" + new Date().getTime(),
    Utilities.Charset.UTF_8
  );
  var num = 0;
  for (var i = 0; i < 4; i++) {
    num = ((num * 256) + (bytes[i] < 0 ? bytes[i] + 256 : bytes[i])) >>> 0;
  }
  return String(num % Math.pow(10, digits)).padStart(digits, "0");
}

function hashPasswordLegacy_(password) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password || ""), Utilities.Charset.UTF_8);
  return "sha256:" + bytes.map(function(b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
}

function generateProjectId_(ss) {
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var existing = {};
  [CONFIG.SHEET_LEADS, CONFIG.SHEET_CLIENTS].forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2) return;
    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
    var col = sheetName === CONFIG.SHEET_LEADS ? 0 : headers.indexOf("projectid");
    for (var i = 1; i < data.length; i++) {
      var pid = normalizeProjectId_(col === 0 ? data[i][0] : data[i][col]);
      if (pid) existing[pid] = true;
    }
  });
  for (var attempt = 0; attempt < 15; attempt++) {
    var candidate = normalizeProjectId_("FA-" + Utilities.getUuid().replace(/-/g, "").slice(0, 12).toUpperCase());
    if (!existing[candidate]) return candidate.replace(/^#/, "");
  }
  return "FA-" + Utilities.getUuid().replace(/-/g, "").slice(0, 12).toUpperCase();
}

function sendAdminSetupEmail_() {
  var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var usersSheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!usersSheet || usersSheet.getLastRow() < 2) {
    return { success: false, error: "Sheet Users belum tersedia." };
  }
  migrateUsersSheetColumns_(usersSheet);
  var data = usersSheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var emailCol = headers.indexOf("email");
  var passwordCol = headers.indexOf("password");
  var adminEmail = String(CONFIG.EMAIL_FROM || "").trim().toLowerCase();
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][emailCol] || "").trim().toLowerCase() === adminEmail) {
      rowIndex = i + 1;
      break;
    }
  }
  if (rowIndex < 0) return { success: false, error: "Akun admin tidak ditemukan di sheet Users." };
  var tempPassword = generateSecureToken_(16);
  usersSheet.getRange(rowIndex, passwordCol + 1).setValue(hashPassword_(tempPassword));
  revokeAllInternalSessions_(adminEmail);
  MailApp.sendEmail({
    to: adminEmail,
    subject: "[FA Studio] Password Operation System",
    body: [
      "Password sementara akun admin Operation System:",
      "",
      tempPassword,
      "",
      "Gunakan untuk login pertama, lalu segera ganti melalui User Management.",
      "Jika Anda tidak meminta reset ini, segera hubungi tim FA Studio."
    ].join("\n"),
    name: getMailIdentity_().name,
    replyTo: getMailIdentity_().replyTo
  });
  PropertiesService.getScriptProperties().setProperty("ADMIN_SETUP_EMAIL_SENT", "TRUE");
  return { success: true, message: "Password sementara dikirim ke " + adminEmail };
}

function ensureAdminAccountReady_(usersSheet) {
  migrateUsersSheetColumns_(usersSheet);
  var data = usersSheet.getDataRange().getValues();
  if (data.length <= 1) return;
  var headers = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var emailCol = headers.indexOf("email");
  var passwordCol = headers.indexOf("password");
  var roleCol = headers.indexOf("role");
  if (emailCol < 0 || passwordCol < 0) return;
  var adminEmail = String(CONFIG.EMAIL_FROM || "").trim().toLowerCase();
  var props = PropertiesService.getScriptProperties();

  for (var i = 1; i < data.length; i++) {
    var email = String(data[i][emailCol] || "").trim().toLowerCase();
    if (email !== adminEmail) continue;
    if (roleCol >= 0 && String(data[i][roleCol] || "").trim().toUpperCase() === "INTERNAL") {
      usersSheet.getRange(i + 1, roleCol + 1).setValue("DIRECTOR");
    }
    var stored = String(data[i][passwordCol] || "").trim();
    if (stored) continue;
    if (props.getProperty("ADMIN_SETUP_EMAIL_SENT") === "TRUE") continue;
    try {
      sendAdminSetupEmail_();
    } catch (err) {
      Logger.log("Auto setup admin gagal: " + err.message);
    }
    break;
  }
}

function getRecaptchaSiteKey_() {
  return String(getConfig_("RECAPTCHA_SITE_KEY") || "").trim();
}

function getRecaptchaSecretKey_() {
  return String(getConfig_("RECAPTCHA_SECRET_KEY") || "").trim();
}

function getPublicRecaptchaSiteKey_() {
  return getRecaptchaSecretKey_() ? getRecaptchaSiteKey_() : "";
}

function isRecaptchaEnabled_() {
  return !!(getRecaptchaSiteKey_() && getRecaptchaSecretKey_());
}

function verifyRecaptchaToken_(token) {
  if (!isRecaptchaEnabled_()) {
    if (getRecaptchaSiteKey_() && !getRecaptchaSecretKey_()) {
      return { ok: false, error: "reCAPTCHA belum dikonfigurasi di server. Isi Script Property RECAPTCHA_SECRET_KEY." };
    }
    return { ok: true, skipped: true };
  }
  token = String(token || "").trim();
  if (!token) return { ok: false, error: "Centang reCAPTCHA terlebih dahulu." };
  try {
    var payload = "secret=" + encodeURIComponent(getRecaptchaSecretKey_())
      + "&response=" + encodeURIComponent(token);
    var response = UrlFetchApp.fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "post",
      contentType: "application/x-www-form-urlencoded",
      payload: payload,
      muteHttpExceptions: true,
      followRedirects: true
    });
    var raw = response.getContentText() || "{}";
    var data = JSON.parse(raw);
    if (data && data.success === true) return { ok: true };
    var codes = (data && data["error-codes"]) ? data["error-codes"].join(", ") : "";
    if (codes.indexOf("invalid-input-secret") >= 0) {
      return { ok: false, error: "Secret Key reCAPTCHA tidak valid atau tidak cocok dengan Site Key." };
    }
    if (codes.indexOf("timeout-or-duplicate") >= 0 || codes.indexOf("invalid-input-response") >= 0) {
      return { ok: false, error: "reCAPTCHA kedaluwarsa. Centang lagi, lalu Sign In." };
    }
    return { ok: false, error: "Verifikasi reCAPTCHA gagal. Coba centang lagi." };
  } catch (err) {
    Logger.log("verifyRecaptchaToken_ gagal: " + err.message);
    var msg = String(err && err.message || "");
    if (/authoriz|permission|external_request|Access denied/i.test(msg)) {
      return {
        ok: false,
        error: "Server belum diizinkan menghubungi Google. Di editor Apps Script jalankan authorizeRecaptchaFetch_, klik Allow, lalu deploy ulang."
      };
    }
    return { ok: false, error: "Verifikasi reCAPTCHA gagal. Coba lagi." };
  }
}

/**
 * Kunci sekali pakai untuk fungsi admin di dropdown Run.
 * Session.getActiveUser() sering kosong bahkan dari editor, jadi tidak dipakai.
 *
 * Cara: Script Properties → ALLOW_EDITOR_RUN = YES → Run fungsi → property dihapus otomatis.
 */
function consumeEditorRunUnlock_() {
  var props = PropertiesService.getScriptProperties();
  var unlock = String(props.getProperty("ALLOW_EDITOR_RUN") || "").trim().toUpperCase();
  if (unlock !== "YES") {
    throw new Error(
      "Belum diizinkan. Di Project Settings → Script properties, tambah ALLOW_EDITOR_RUN = YES, lalu Run lagi. Property ini akan dihapus otomatis setelah sukses."
    );
  }
  try { props.deleteProperty("ALLOW_EDITOR_RUN"); } catch (e) {}
}

/** Dropdown Run: izinkan UrlFetchApp untuk reCAPTCHA. */
function runAuthorizeRecaptchaFetch() {
  consumeEditorRunUnlock_();
  return authorizeRecaptchaFetch_();
}

/** Dropdown Run: kunci editor Spreadsheet + proteksi SecurityAuditLog. */
function runHardenSpreadsheetAccess() {
  consumeEditorRunUnlock_();
  return hardenSpreadsheetAccess_();
}

/** Dropdown Run: cek Script Properties vs source. Lihat Execution log. */
function runCheckSecurityConfigStatus() {
  // Read-only: aman tanpa unlock.
  return checkSecurityConfigStatus_();
}

/** Jalankan sekali dari editor Apps Script supaya izin UrlFetchApp muncul, lalu Allow. Private. */
function authorizeRecaptchaFetch_() {
  var res = UrlFetchApp.fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "post",
    contentType: "application/x-www-form-urlencoded",
    payload: "secret=test&response=test",
    muteHttpExceptions: true
  });
  Logger.log(res.getResponseCode() + " " + res.getContentText());
  return "Izin UrlFetchApp siap. Deploy ulang web app, lalu coba Sign In lagi.";
}

function getMailIdentity_() {
  return {
    name: CONFIG.COMPANY_NAME,
    replyTo: CONFIG.COMPANY_EMAIL
  };
}

// ── SERVE WEB APP ───────────────────────────────────────────
function include(filename) {
  // evaluate() agar nested <?!= include(...) ?> di partial (mis. PageOps) ikut terproses.
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

function doGet(e) {
  // Jangan buka Spreadsheet di sini — itu yang bikin first paint 5–15 detik.
  // Setup sheet tetap jalan saat login / operasi data.
  // Query ?page=ops dari Vercel TIDAK masuk window.location di iframe HtmlService —
  // harus di-inject dari e.parameter di sini.
  var initialPage = "";
  try {
    initialPage = String((e && e.parameter && e.parameter.page) || "").trim().toLowerCase();
  } catch (err) {
    initialPage = "";
  }
  if (initialPage === "faq-contact") initialPage = "about";
  if (initialPage === "booking" || initialPage === "login" || initialPage === "signin") {
    initialPage = "ops";
  }
  var allowed = { home: 1, ops: 1, gallery: 1, about: 1, "reset-password": 1 };
  if (!allowed[initialPage]) initialPage = "";

  // Auth shell: skip marketing HTML/hero base64 supaya login jauh lebih cepat.
  var useAuthShell = (initialPage === "ops" || initialPage === "reset-password");
  var template = HtmlService.createTemplateFromFile(useAuthShell ? "IndexAuth" : "Index");
  template.initialPage = initialPage || (useAuthShell ? "ops" : "");
  template.publicSiteUrl = "https://www.fastudio.id";
  var out = template
    .evaluate()
    .setTitle(useAuthShell ? "Sign In — FA Studio Indonesia" : "FA Studio Indonesia")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  var faviconUrl = getAppFaviconUrl_();
  if (faviconUrl) out.setFaviconUrl(faviconUrl);
  return out;
}

/** Panggilan ringan agar instance Apps Script sudah hangat sebelum user klik Sign In. */
function warmup() {
  return true;
}

function ensureUsersSheet_(ss) {
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  try {
    ensureClientUsersSheet_(ss);
  } catch (err) {
    Logger.log("ensureClientUsersSheet_ gagal: " + err.message);
  }
  var usersSheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(CONFIG.SHEET_USERS);
    usersSheet.appendRow(["email", "name", "role", "password", "isActive", "createdAt"]);
    var tempPassword = generateSecureToken_(16);
    usersSheet.appendRow([
      CONFIG.EMAIL_FROM, "Admin FA Studio", "DIRECTOR", hashPassword_(tempPassword), "TRUE",
      new Date().toLocaleString("id-ID")
    ]);
    try {
      MailApp.sendEmail({
        to: CONFIG.EMAIL_FROM,
        subject: "[FA Studio] Password awal Operation System",
        body: [
          "Password awal akun admin Operation System:",
          "",
          tempPassword,
          "",
          "Gunakan untuk login pertama, lalu segera ganti melalui User Management."
        ].join("\n"),
        name: getMailIdentity_().name,
        replyTo: getMailIdentity_().replyTo
      });
      PropertiesService.getScriptProperties().setProperty("ADMIN_SETUP_EMAIL_SENT", "TRUE");
    } catch (err) {
      Logger.log("Gagal kirim email password awal admin: " + err.message);
    }
  } else {
    migrateUsersSheetColumns_(usersSheet);
    ensureAdminAccountReady_(usersSheet);
  }

  ensureClientUsersSheet_(ss);
  migrateClientAccountsToOwnSheet_(ss);
  return usersSheet;
}

function getClientUserHeaders_() {
  return ["email", "name", "password", "isActive", "createdAt", "pdpConsent", "pdpConsentAt", "pdpPolicyVersion"];
}

function isTruthyConsent_(value) {
  if (value === true || value === 1) return true;
  if (value && typeof value === "object") {
    return isTruthyConsent_(value.pdpConsent || value.accepted || value.agreementAccepted);
  }
  var raw = String(value || "").trim().toUpperCase();
  return raw === "TRUE" || raw === "1" || raw === "YES";
}

function getPdpPolicyVersion_(consentData) {
  if (consentData && typeof consentData === "object" && consentData.pdpPolicyVersion) {
    return String(consentData.pdpPolicyVersion || "").trim() || CONFIG.PDP_POLICY_VERSION;
  }
  return CONFIG.PDP_POLICY_VERSION;
}

function ensureClientUsersSheet_(ss) {
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var sheet = ss.getSheetByName(CONFIG.SHEET_CLIENT_USERS);
  var headers = getClientUserHeaders_();
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_CLIENT_USERS);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    Logger.log("Sheet 'ClientUsers' berhasil dibuat");
    return sheet;
  }
  if (sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return sheet;
  }
  var existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return String(h || "").trim();
  });
  headers.forEach(function(header) {
    if (existing.indexOf(header) < 0) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      existing.push(header);
    }
  });
  return sheet;
}

/** Setup sheet akun. Jalankan dari editor Apps Script saja (private — tidak callable via google.script.run). */
function setupAccountSheets_() {
  try {
    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var clientSheet = ensureClientUsersSheet_(ss);
    ensureUsersSheet_(ss);
    migrateClientAccountsToOwnSheet_(ss);
    clientSheet = ss.getSheetByName(CONFIG.SHEET_CLIENT_USERS);
    return {
      success: true,
      message: "Sheet ClientUsers siap.",
      clientUsersSheet: CONFIG.SHEET_CLIENT_USERS,
      clientUsersRows: clientSheet ? Math.max(0, clientSheet.getLastRow() - 1) : 0
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function migrateClientAccountsToOwnSheet_(ss) {
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return;
  try {
    migrateClientAccountsToOwnSheetUnlocked_(ss);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function migrateClientAccountsToOwnSheetUnlocked_(ss) {
  var usersSheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!usersSheet || usersSheet.getLastRow() < 2) return;
  var clientSheet = ensureClientUsersSheet_(ss);
  var data = usersSheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var emailCol = headers.indexOf("email");
  var nameCol = headers.indexOf("name");
  var roleCol = headers.indexOf("role");
  var passwordCol = headers.indexOf("password");
  var activeCol = headers.indexOf("isactive");
  var createdCol = headers.indexOf("createdat");
  if (emailCol < 0) emailCol = 0;
  if (nameCol < 0) nameCol = 1;
  if (roleCol < 0) roleCol = 2;
  if (passwordCol < 0) passwordCol = 3;
  if (activeCol < 0) activeCol = 4;

  var existingClientEmails = {};
  if (clientSheet.getLastRow() > 1) {
    var clientData = clientSheet.getDataRange().getValues();
    var clientHeaders = clientData[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
    var clientEmailCol = clientHeaders.indexOf("email");
    if (clientEmailCol < 0) clientEmailCol = 0;
    for (var c = 1; c < clientData.length; c++) {
      var existingEmail = String(clientData[c][clientEmailCol] || "").trim().toLowerCase();
      if (existingEmail) existingClientEmails[existingEmail] = true;
    }
  }

  var deleteRows = [];
  var migratedEmails = [];
  for (var i = 1; i < data.length; i++) {
    if (!isClientRole_(data[i][roleCol])) continue;
    var email = String(data[i][emailCol] || "").trim().toLowerCase();
    if (email && !existingClientEmails[email]) {
      appendRowByHeader_(clientSheet, {
        email: email,
        name: String(data[i][nameCol] || "").trim(),
        password: passwordCol >= 0 ? data[i][passwordCol] : "",
        isActive: data[i][activeCol],
        createdAt: createdCol >= 0 ? data[i][createdCol] : ""
      });
      existingClientEmails[email] = true;
    }
    if (email) migratedEmails.push(email);
    deleteRows.push(i + 1);
  }
  deleteRows.sort(function(a, b) { return b - a; });
  deleteRows.forEach(function(rowIndex) {
    usersSheet.deleteRow(rowIndex);
  });
  migratedEmails.forEach(function(migratedEmail) {
    invalidateUserCache_(migratedEmail);
  });
  if (deleteRows.length) {
    Logger.log("Migrasi " + deleteRows.length + " akun client dari Users ke ClientUsers.");
  }
}

// ── ADD CLIENT INTAKE (dari form klien) ─────────────────────
function sendBookingEmailOtp(email, brandName) {
  try {
    email = String(email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Email tidak valid." };
    }
    if (!checkRateLimit_("otp_send_" + Utilities.base64EncodeWebSafe(email), 5, 600, email)) {
      return { success: false, error: "Terlalu banyak permintaan OTP. Coba lagi beberapa menit lagi." };
    }

    var otp = generateNumericOtp_(6);
    var cacheKey = "booking_email_otp_" + Utilities.base64EncodeWebSafe(email);
    CacheService.getScriptCache().put(cacheKey, otp, 300);

    var subject = "Kode OTP Booking FA Studio";
    var name = brandName ? String(brandName).trim() : "calon client";
    var body = [
      "Halo " + name + ",",
      "",
      "Kode OTP untuk melanjutkan Booking Now FA Studio adalah:",
      "",
      otp,
      "",
      "Kode ini berlaku selama 5 menit. Jika kamu tidak meminta kode ini, abaikan email ini.",
      "",
      "FA Studio"
    ].join("\n");

    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: body,
      name: getMailIdentity_().name,
      replyTo: getMailIdentity_().replyTo
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function verifyBookingEmailOtp(email, otp) {
  try {
    email = String(email || "").trim().toLowerCase();
    otp = String(otp || "").trim();
    if (!email || !otp) return { success: false, error: "Email dan OTP wajib diisi." };
    if (!checkRateLimit_("booking_verify_" + Utilities.base64EncodeWebSafe(email), 8, 600, email)) {
      return { success: false, error: "Terlalu banyak percobaan verifikasi. Coba lagi beberapa menit lagi." };
    }

    var cacheKey = "booking_email_otp_" + Utilities.base64EncodeWebSafe(email);
    var cache = CacheService.getScriptCache();
    var storedOtp = cache.get(cacheKey);
    if (!storedOtp || storedOtp !== otp) {
      return { success: false, error: "OTP tidak valid atau sudah expired." };
    }

    cache.remove(cacheKey);
    cache.put(getBookingEmailVerifiedCacheKey_(email), "TRUE", 1800);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getSignupEmailOtpCacheKey_(email) {
  return "signup_email_otp_" + Utilities.base64EncodeWebSafe(String(email || "").trim().toLowerCase());
}

function getSignupEmailVerifiedCacheKey_(email) {
  return "signup_email_verified_" + Utilities.base64EncodeWebSafe(String(email || "").trim().toLowerCase());
}

function isSignupEmailVerified_(email) {
  if (!email) return false;
  return CacheService.getScriptCache().get(getSignupEmailVerifiedCacheKey_(email)) === "TRUE";
}

function sendSignupEmailOtp(email, name) {
  try {
    email = String(email || "").trim().toLowerCase();
    name = String(name || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Email tidak valid." };
    }
    if (!checkRateLimit_("signup_otp_send_" + Utilities.base64EncodeWebSafe(email), 5, 600, email)) {
      return { success: false, error: "Terlalu banyak permintaan OTP. Coba lagi beberapa menit lagi." };
    }

    ensureUsersSheet_();
    if (findUserByEmail_(email)) {
      return { success: false, error: "Email ini sudah terdaftar. Silakan Sign In." };
    }

    var otp = generateNumericOtp_(6);
    CacheService.getScriptCache().put(getSignupEmailOtpCacheKey_(email), otp, 300);
    CacheService.getScriptCache().remove(getSignupEmailVerifiedCacheKey_(email));

    MailApp.sendEmail({
      to: email,
      subject: "Kode OTP Sign Up FA Studio",
      body: [
        "Halo " + (name || "calon pengguna") + ",",
        "",
        "Kode OTP untuk membuat akun FA Studio adalah:",
        "",
        otp,
        "",
        "Kode ini berlaku selama 5 menit. Jika kamu tidak meminta kode ini, abaikan email ini.",
        "",
        "FA Studio"
      ].join("\n"),
      name: getMailIdentity_().name,
      replyTo: getMailIdentity_().replyTo
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function verifySignupEmailOtp(email, otp) {
  try {
    email = String(email || "").trim().toLowerCase();
    otp = String(otp || "").trim();
    if (!email || !otp) return { success: false, error: "Email dan OTP wajib diisi." };
    if (!checkRateLimit_("signup_otp_verify_" + Utilities.base64EncodeWebSafe(email), 8, 600, email)) {
      return { success: false, error: "Terlalu banyak percobaan verifikasi. Coba lagi beberapa menit lagi." };
    }

    var cache = CacheService.getScriptCache();
    var storedOtp = cache.get(getSignupEmailOtpCacheKey_(email));
    if (!storedOtp || storedOtp !== otp) {
      return { success: false, error: "OTP tidak valid atau sudah expired." };
    }

    cache.remove(getSignupEmailOtpCacheKey_(email));
    cache.put(getSignupEmailVerifiedCacheKey_(email), "TRUE", 1800);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getPasswordResetOtpCacheKey_(email) {
  return "reset_pwd_otp_" + Utilities.base64EncodeWebSafe(String(email || "").trim().toLowerCase());
}

function getPasswordResetVerifiedCacheKey_(email) {
  return "reset_pwd_verified_" + Utilities.base64EncodeWebSafe(String(email || "").trim().toLowerCase());
}

function isPasswordResetVerified_(email) {
  if (!email) return false;
  return CacheService.getScriptCache().get(getPasswordResetVerifiedCacheKey_(email)) === "TRUE";
}

function sendPasswordResetOtp(email) {
  try {
    email = String(email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Email tidak valid." };
    }
    if (!checkRateLimit_("reset_pwd_otp_send_" + Utilities.base64EncodeWebSafe(email), 5, 600, email)) {
      return { success: false, error: "Terlalu banyak permintaan OTP. Coba lagi beberapa menit lagi." };
    }

    ensureUsersSheet_();
    var user = findUserByEmail_(email);
    if (!user) {
      return { success: false, error: "Email tidak terdaftar." };
    }
    var isActive = user.isActive === true || String(user.isActive || "").trim().toUpperCase() === "TRUE";
    if (!isActive) {
      return { success: false, error: "Akun tidak aktif. Hubungi tim FA Studio." };
    }

    var otp = generateNumericOtp_(6);
    CacheService.getScriptCache().put(getPasswordResetOtpCacheKey_(email), otp, 300);
    CacheService.getScriptCache().remove(getPasswordResetVerifiedCacheKey_(email));

    MailApp.sendEmail({
      to: email,
      subject: "Kode OTP Reset Password FA Studio",
      body: [
        "Halo " + (user.name || "pengguna") + ",",
        "",
        "Kode OTP untuk reset password akun FA Studio adalah:",
        "",
        otp,
        "",
        "Kode ini berlaku selama 5 menit. Jika kamu tidak meminta reset password, abaikan email ini.",
        "",
        "FA Studio"
      ].join("\n"),
      name: getMailIdentity_().name,
      replyTo: getMailIdentity_().replyTo
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function verifyPasswordResetOtp(email, otp) {
  try {
    email = String(email || "").trim().toLowerCase();
    otp = String(otp || "").trim();
    if (!email || !otp) return { success: false, error: "Email dan OTP wajib diisi." };
    if (!checkRateLimit_("reset_pwd_otp_verify_" + Utilities.base64EncodeWebSafe(email), 8, 600, email)) {
      return { success: false, error: "Terlalu banyak percobaan verifikasi. Coba lagi beberapa menit lagi." };
    }

    var user = findUserByEmail_(email);
    if (!user) return { success: false, error: "Email tidak terdaftar." };

    var cache = CacheService.getScriptCache();
    var storedOtp = cache.get(getPasswordResetOtpCacheKey_(email));
    if (!storedOtp || storedOtp !== otp) {
      return { success: false, error: "OTP tidak valid atau sudah expired." };
    }

    cache.remove(getPasswordResetOtpCacheKey_(email));
    cache.put(getPasswordResetVerifiedCacheKey_(email), "TRUE", 1800);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function resetAccountPassword(email, newPassword) {
  try {
    email = String(email || "").trim().toLowerCase();
    newPassword = String(newPassword || "");
    if (!email) return { success: false, error: "Email wajib diisi." };
    var policy = validatePasswordPolicy_(newPassword);
    if (!policy.ok) return { success: false, error: policy.error };
    if (!isPasswordResetVerified_(email)) {
      return { success: false, error: "Verifikasi OTP belum selesai. Kirim dan verifikasi OTP terlebih dahulu." };
    }
    if (!checkRateLimit_("reset_pwd_submit_" + Utilities.base64EncodeWebSafe(email), 5, 600, email)) {
      return { success: false, error: "Terlalu banyak percobaan reset. Coba lagi beberapa menit lagi." };
    }

    var user = findUserByEmail_(email);
    if (!user) return { success: false, error: "Email tidak terdaftar." };
    var isActive = user.isActive === true || String(user.isActive || "").trim().toUpperCase() === "TRUE";
    if (!isActive) return { success: false, error: "Akun tidak aktif." };

    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var sheet = ss.getSheetByName(user.sheetName);
    if (!sheet) return { success: false, error: "Data pengguna tidak ditemukan." };

    var passwordHash = hashPassword_(newPassword);
    if (user.passwordCol >= 0) {
      sheet.getRange(user.rowIndex, user.passwordCol + 1).setValue(passwordHash);
    } else {
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
        return String(h || "").trim().toLowerCase();
      });
      setSheetCellByHeader_(sheet, user.rowIndex, headers, "password", passwordHash);
    }

    CacheService.getScriptCache().remove(getPasswordResetVerifiedCacheKey_(email));
    invalidateUserCache_(email);
    revokeAllInternalSessions_(email);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function sendClientPortalOtp(projectId, email) {
  try {
    projectId = normalizeProjectId_(projectId);
    email = String(email || "").trim().toLowerCase();
    if (!projectId || !email) return { success: false, error: "Project ID dan email wajib diisi." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Email tidak valid." };
    }
    if (!checkRateLimit_("client_portal_otp_" + Utilities.base64EncodeWebSafe(projectId + "_" + email), 5, 600, email)) {
      return { success: false, error: "Terlalu banyak permintaan OTP. Coba lagi beberapa menit lagi." };
    }

    var lead = getLeadByProjectId_(projectId);
    var registeredEmail = lead ? String(lead.clientEmail || "").trim().toLowerCase() : "";
    if (!lead || !registeredEmail || registeredEmail !== email) {
      return { success: false, error: "Project ID atau email tidak cocok. Periksa kembali data booking Anda." };
    }

    var otp = generateNumericOtp_(6);
    CacheService.getScriptCache().put(getClientPortalOtpCacheKey_(projectId, email), otp, 300);
    MailApp.sendEmail({
      to: email,
      subject: "Kode OTP Client Portal FA Studio",
      body: [
        "Halo " + (lead.clientName || "client") + ",",
        "",
        "Kode OTP untuk membuka Client Portal project " + projectId + " adalah:",
        "",
        otp,
        "",
        "Kode ini berlaku selama 5 menit. Jika kamu tidak meminta kode ini, abaikan email ini.",
        "",
        "FA Studio"
      ].join("\n"),
      name: getMailIdentity_().name,
      replyTo: getMailIdentity_().replyTo
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function verifyClientPortalOtp(projectId, email, otp) {
  try {
    projectId = normalizeProjectId_(projectId);
    email = String(email || "").trim().toLowerCase();
    otp = String(otp || "").trim();
    if (!projectId || !email || !otp) {
      return { success: false, error: "Project ID, email, dan OTP wajib diisi." };
    }
    if (!checkRateLimit_("client_portal_verify_" + Utilities.base64EncodeWebSafe(projectId + "_" + email), 8, 600, email)) {
      return { success: false, error: "Terlalu banyak percobaan verifikasi. Coba lagi beberapa menit lagi." };
    }

    var cacheKey = getClientPortalOtpCacheKey_(projectId, email);
    var storedOtp = CacheService.getScriptCache().get(cacheKey);
    if (!storedOtp || storedOtp !== otp) {
      return { success: false, error: "OTP tidak valid atau sudah expired." };
    }

    var project = getClientPortalProject_(projectId, email);
    if (!project.success) return project;
    CacheService.getScriptCache().remove(cacheKey);
    var sessionToken = createClientPortalSession_(projectId, email);
    return { success: true, project: project.project, sessionToken: sessionToken };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getClientPortalSessionCacheKey_(sessionToken) {
  return "client_portal_session_" + String(sessionToken || "").trim();
}

function createClientPortalSession_(projectId, email) {
  var token = Utilities.getUuid() + "-" + Utilities.getUuid();
  var payload = JSON.stringify({
    projectId: normalizeProjectId_(projectId),
    email: String(email || "").trim().toLowerCase()
  });
  CacheService.getScriptCache().put(getClientPortalSessionCacheKey_(token), payload, 3600);
  return token;
}

function validateClientPortalSession_(projectId, email, sessionToken) {
  sessionToken = String(sessionToken || "").trim();
  if (!sessionToken) return false;
  var raw = CacheService.getScriptCache().get(getClientPortalSessionCacheKey_(sessionToken));
  if (!raw) return false;
  try {
    var parsed = JSON.parse(raw);
    return normalizeProjectId_(parsed.projectId) === normalizeProjectId_(projectId)
      && String(parsed.email || "").trim().toLowerCase() === String(email || "").trim().toLowerCase();
  } catch (err) {
    return false;
  }
}

function destroyClientPortalSession_(sessionToken) {
  sessionToken = String(sessionToken || "").trim();
  if (!sessionToken) return;
  CacheService.getScriptCache().remove(getClientPortalSessionCacheKey_(sessionToken));
}

function refreshClientPortalProject(projectId, email, sessionToken) {
  try {
    if (!validateClientPortalSession_(projectId, email, sessionToken)) {
      return { success: false, error: "Sesi Client Portal tidak valid atau sudah expired." };
    }
    var project = getClientPortalProject_(projectId, email);
    if (!project.success) return project;
    return { success: true, project: project.project };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function logoutClientPortal(sessionToken) {
  try {
    destroyClientPortalSession_(sessionToken);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getClientPortalOtpCacheKey_(projectId, email) {
  return "client_portal_otp_" + Utilities.base64EncodeWebSafe(normalizeProjectId_(projectId) + "_" + String(email || "").trim().toLowerCase());
}

function getClientPortalProject_(projectId, email) {
  initializeGoogleSheets_();
  initializePaymentSheets_();
  projectId = normalizeProjectId_(projectId);
  email = String(email || "").trim().toLowerCase();
  var lead = getLeadByProjectId_(projectId);
  var registeredEmail = lead ? String(lead.clientEmail || "").trim().toLowerCase() : "";
  if (!lead || !registeredEmail || registeredEmail !== email) {
    return { success: false, error: "Project ID atau email tidak cocok. Periksa kembali data booking Anda." };
  }
  return buildClientPortalProjectPayload_(lead);
}

function getClientPortalProjectById_(projectId) {
  initializeGoogleSheets_();
  initializePaymentSheets_();
  projectId = normalizeProjectId_(projectId);
  var lead = getLeadByProjectId_(projectId);
  if (!lead) return { success: false, error: "Project tidak ditemukan." };
  return buildClientPortalProjectPayload_(lead);
}

/** Ringkasan jadwal shooting untuk dashboard client. */
function buildShootingSchedulePayload_(lead) {
  lead = lead || {};
  var empty = { hasSchedule: false, days: 0, startDate: "", endDate: "", label: "", released: false };
  var startIso = toShootingIsoDate_(lead.shootingStartDate);
  if (!startIso) return empty;
  var days = Number(lead.shootingDays || 0);
  if (!days || days < 1) {
    var endRaw = toShootingIsoDate_(lead.shootingEndDate);
    days = endRaw ? countShootingDaysBetween_(startIso, endRaw) : 1;
  }
  if (days > 30) days = 30;
  var normalized = normalizeShootingSchedule_({ shootingDays: days, shootingStartDate: startIso });
  if (normalized.error) return empty;
  var label = String(lead.shootingDateLabel || "").trim() || normalized.shootingDateLabel;
  return {
    hasSchedule: true,
    days: normalized.shootingDays,
    startDate: normalized.shootingStartDate,
    endDate: normalized.shootingEndDate,
    label: label,
    released: !!String(lead.shootingReleasedAt || "").trim()
  };
}

function buildClientPortalProjectPayload_(lead, shared) {
  shared = shared || {};
  var projectId = normalizeProjectId_(lead && lead.projectId);
  var rawPayments = shared.rawPayments || getPaymentsMapByProject_();
  var invoiceAgg = shared.invoiceAgg || getInvoiceAggMap_();
  var paymentMap = shared.paymentMap || serializePaymentMap_(rawPayments, null, invoiceAgg);
  var payment = paymentMap[projectId] || paymentMap[String(projectId).replace(/^#/, "")] || {};
  var projectTotal = parseProjectTotal_(payment.projectTotal || lead.projectTotal);
  var totalPaid = Number(payment.totalPaid || 0);
  var remainingAmount = payment.remainingAmount !== undefined && payment.remainingAmount !== ""
    ? Number(payment.remainingAmount)
    : (projectTotal ? Math.max(projectTotal - totalPaid, 0) : "");
  var production = buildProductionProgressPayload_(
    lead.productionStage,
    lead.postProductionProgress,
    lead.productionUpdatedAt,
    lead.productionUpdatedBy,
    lead.productionNotes
  );
  var productionOps = buildClientProductionOpsReport_(lead);
  production.overallPercent = productionOps.overallPercent;
  production.stage = productionOps.stage || production.stage;
  var driveGate = getClientDriveGateState_(lead, productionOps, payment);
  return {
    success: true,
    project: {
      projectId: lead.projectId,
      clientName: lead.clientName,
      category: lead.category,
      status: lead.status || "New Lead",
      pic: lead.pic || "",
      timestamp: lead.timestamp || "",
      driveUrl: driveGate.unlocked ? (lead.driveUrl || "") : "",
      driveUnlocked: driveGate.unlocked,
      driveGateNote: driveGate.note || "",
      driveGate: {
        productionReady: !!driveGate.productionReady,
        paymentReady: !!driveGate.paymentReady,
        unlocked: !!driveGate.unlocked
      },
      paymentStatus: payment.paymentStatus || "UNPAID",
      projectTotal: projectTotal || "",
      totalPaid: totalPaid,
      remainingAmount: remainingAmount,
      invoiceUrl: payment.invoiceUrl || "",
      invoiceNumber: payment.invoiceNumber || "",
      invoiceSentAt: payment.invoiceSentAt || payment.validatedAt || "",
      production: production,
      productionOps: productionOps,
      shooting: buildShootingSchedulePayload_(lead),
      // Timeline UI sudah dihapus dari client dashboard — skip baca sheet history.
      timeline: []
    }
  };
}

function getClientPortalTimeline_(projectId, lead, payment) {
  var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  projectId = normalizeProjectId_(projectId);
  var timeline = [{
    type: "PROJECT_CREATED",
    title: "Project masuk database",
    description: (lead.clientName || "Client") + " · " + (lead.category || "Project baru"),
    timestamp: lead.timestamp || "",
    actor: "FA Studio",
    order: 0
  }];

  var statusSheet = ensureStatusHistorySheet_(ss);
  if (statusSheet && statusSheet.getLastRow() > 1) {
    var statusRows = statusSheet.getDataRange().getValues();
    var statusMap = getHeaderIndexMap_(statusRows[0]);
    var statusProjectCol = statusMap.projectid !== undefined ? statusMap.projectid : 1;
    var statusOldCol = statusMap.oldstatus !== undefined ? statusMap.oldstatus : 2;
    var statusNewCol = statusMap.newstatus !== undefined ? statusMap.newstatus : 3;
    var statusTimeCol = statusMap.timestamp !== undefined ? statusMap.timestamp : 0;
    var statusByCol = statusMap.changedby;
    for (var i = 1; i < statusRows.length; i++) {
      if (sameProjectId_(statusRows[i][statusProjectCol], projectId)) {
        var oldStatus = statusRows[i][statusOldCol] || "";
        var newStatus = statusRows[i][statusNewCol] || "";
        timeline.push({
          type: "PROJECT_STATUS",
          title: "Status project diperbarui",
          description: (oldStatus || "-") + " → " + (newStatus || "-"),
          timestamp: formatCellValue_(statusRows[i][statusTimeCol]),
          actor: statusByCol !== undefined ? String(statusRows[i][statusByCol] || "FA Studio") : "FA Studio",
          order: timeline.length + i
        });
      }
    }
  }

  var invoiceSheet = ss.getSheetByName(CONFIG.SHEET_PAY_INVOICES);
  if (invoiceSheet && invoiceSheet.getLastRow() > 1) {
    var invoiceRows = invoiceSheet.getDataRange().getValues();
    var invoiceHeaders = invoiceRows[0];
    var invProjectCol = invoiceHeaders.indexOf("projectId");
    var invNumberCol = invoiceHeaders.indexOf("invoiceNumber");
    var invAmountCol = invoiceHeaders.indexOf("amount");
    var invTimeCol = invoiceHeaders.indexOf("timestamp");
    for (var j = 1; j < invoiceRows.length; j++) {
      if (invProjectCol >= 0 && sameProjectId_(invoiceRows[j][invProjectCol], projectId)) {
        var invAmount = Number(invAmountCol >= 0 ? invoiceRows[j][invAmountCol] : 0);
        timeline.push({
          type: "INVOICE",
          title: "Invoice tersedia",
          description: String(invNumberCol >= 0 ? invoiceRows[j][invNumberCol] : "Invoice") + " · Rp " + invAmount.toLocaleString("id-ID"),
          timestamp: invTimeCol >= 0 ? formatCellValue_(invoiceRows[j][invTimeCol]) : "",
          actor: "FA Studio Billing",
          order: timeline.length + j
        });
      }
    }
  }

  if (payment && payment.paymentStatus && payment.paymentStatus !== "UNPAID") {
    timeline.push({
      type: "PAYMENT_STATUS",
      title: "Payment tervalidasi",
      description: "Status payment: " + payment.paymentStatus,
      timestamp: payment.validatedAt || payment.invoiceSentAt || "",
      actor: "FA Studio Billing",
      order: timeline.length + 9999
    });
  }

  var prodHistSheet = ss.getSheetByName(CONFIG.SHEET_PROD_HIST);
  if (prodHistSheet && prodHistSheet.getLastRow() > 1) {
    var prodRows = prodHistSheet.getDataRange().getValues();
    var prodHeaders = prodRows[0];
    var prodProjectCol = prodHeaders.indexOf("projectId");
    var prodStageCol = prodHeaders.indexOf("newStage");
    var prodProgressCol = prodHeaders.indexOf("newProgress");
    var prodTimeCol = prodHeaders.indexOf("timestamp");
    for (var p = 1; p < prodRows.length; p++) {
      if (prodProjectCol >= 0 && sameProjectId_(prodRows[p][prodProjectCol], projectId)) {
        var prodStage = prodStageCol >= 0 ? String(prodRows[p][prodStageCol] || "") : "";
        var prodProgress = prodProgressCol >= 0 ? String(prodRows[p][prodProgressCol] || "") : "";
        timeline.push({
          type: "PRODUCTION_PROGRESS",
          title: "Progress produksi diperbarui",
          description: prodStage + (prodProgress ? " · " + prodProgress : ""),
          timestamp: prodTimeCol >= 0 ? formatCellValue_(prodRows[p][prodTimeCol]) : "",
          actor: "FA Studio Production",
          order: timeline.length + p + 20000
        });
      }
    }
  }

  timeline.sort(function(a, b) { return Number(b.order || 0) - Number(a.order || 0); });
  return timeline;
}

function getBookingEmailVerifiedCacheKey_(email) {
  return "booking_email_verified_" + Utilities.base64EncodeWebSafe(String(email || "").trim().toLowerCase());
}

function isBookingEmailVerified_(email) {
  if (!email) return false;
  return CacheService.getScriptCache().get(getBookingEmailVerifiedCacheKey_(email)) === "TRUE";
}

// Email yang dikecualikan dari rate limit supaya testing berulang tidak terkunci.
// Tambahan bisa diisi lewat Script Property DEV_RATE_LIMIT_BYPASS (dipisah koma).
var DEV_RATE_LIMIT_BYPASS_ = ["farrasalrisyad123@gmail.com"];
var _DEV_BYPASS_EXTRA_MEMO_ = null;

function getRateLimitBypassExtra_() {
  if (_DEV_BYPASS_EXTRA_MEMO_) return _DEV_BYPASS_EXTRA_MEMO_;
  var list = [];
  try {
    var extra = PropertiesService.getScriptProperties().getProperty("DEV_RATE_LIMIT_BYPASS") || "";
    list = extra.split(",").map(function(item) {
      return String(item).trim().toLowerCase();
    }).filter(Boolean);
  } catch (e) {}
  _DEV_BYPASS_EXTRA_MEMO_ = list;
  return list;
}

function isRateLimitBypassEmail_(email) {
  email = String(email || "").trim().toLowerCase();
  if (!email) return false;
  if (DEV_RATE_LIMIT_BYPASS_.indexOf(email) >= 0) return true;
  return getRateLimitBypassExtra_().indexOf(email) >= 0;
}

function checkRateLimit_(key, limit, ttlSeconds, bypassEmail) {
  if (bypassEmail && isRateLimitBypassEmail_(bypassEmail)) return true;
  var cache = CacheService.getScriptCache();
  var count = Number(cache.get(key) || 0);
  if (count >= limit) return false;
  cache.put(key, String(count + 1), ttlSeconds);
  return true;
}

function isClientSessionEmail_(credential, email) {
  try {
    if (!credential || !email) return false;
    var ctx = requireLoginRole_(credential);
    return isClientRole_(ctx.role) && String(ctx.email || "").trim().toLowerCase() === String(email || "").trim().toLowerCase();
  } catch (err) {
    return false;
  }
}

function parseProjectTotal_(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value > 0 ? Math.round(value) : 0;
  var cleaned = String(value).replace(/[^\d]/g, "");
  var num = Number(cleaned || 0);
  return num > 0 ? Math.round(num) : 0;
}

function formatRupiahId_(value) {
  var num = Number(value || 0);
  return num ? ("Rp " + num.toLocaleString("id-ID")) : "-";
}

var ID_DAY_NAMES_ = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
var ID_MONTH_NAMES_ = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function parseIsoDateOnly_(value) {
  var match = String(value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  var year = Number(match[1]);
  var month = Number(match[2]);
  var day = Number(match[3]);
  var date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function formatIsoDateOnly_(date) {
  if (!date || Object.prototype.toString.call(date) !== "[object Date]" || isNaN(date.getTime())) return "";
  var month = String(date.getMonth() + 1);
  var day = String(date.getDate());
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return date.getFullYear() + "-" + month + "-" + day;
}

function formatIdLongDate_(date) {
  if (!date || Object.prototype.toString.call(date) !== "[object Date]" || isNaN(date.getTime())) return "";
  return ID_DAY_NAMES_[date.getDay()] + ", " + date.getDate() + " " + ID_MONTH_NAMES_[date.getMonth()] + " " + date.getFullYear();
}

/** Terima nilai tanggal dari sheet (string ISO atau object Date) → string ISO. */
function toShootingIsoDate_(value) {
  if (value === null || value === undefined || value === "") return "";
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return isNaN(value.getTime()) ? "" : formatIsoDateOnly_(value);
  }
  var raw = String(value).trim().replace(/^'/, "");
  var parsed = parseIsoDateOnly_(raw);
  return parsed ? formatIsoDateOnly_(parsed) : "";
}

function normalizeShootingSchedule_(formData) {
  var days = Number(formData && formData.shootingDays);
  if (!days || days < 1 || days > 30 || days !== Math.floor(days)) {
    return { error: "Durasi hari shooting wajib diisi (1–30 hari)." };
  }
  var startDate = parseIsoDateOnly_(toShootingIsoDate_(formData.shootingStartDate));
  if (!startDate) {
    return { error: "Tanggal shooting wajib diisi dengan format standar YYYY-MM-DD." };
  }
  var endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + (days - 1));
  var startIso = formatIsoDateOnly_(startDate);
  var endIso = formatIsoDateOnly_(endDate);
  var label = days === 1
    ? formatIdLongDate_(startDate) + " (1 hari)"
    : formatIdLongDate_(startDate) + " – " + formatIdLongDate_(endDate) + " (" + days + " hari)";
  return {
    shootingDays: days,
    shootingStartDate: startIso,
    shootingEndDate: endIso,
    shootingDateLabel: label
  };
}

/** Daftar tanggal ISO yang dipakai satu jadwal shooting. */
function listShootingScheduleDates_(startIso, days) {
  var start = parseIsoDateOnly_(toShootingIsoDate_(startIso));
  days = Number(days || 0);
  if (!start || days < 1) return [];
  if (days > 30) days = 30;
  var dates = [];
  for (var i = 0; i < days; i++) {
    dates.push(formatIsoDateOnly_(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)));
  }
  return dates;
}

// Index tanggal shooting yang sudah terpakai. Sheet Leads dibaca sekali lalu hasilnya
// dicache, jadi kalender di form booking tidak memicu scan sheet tiap kali dibuka.
function buildShootingCalendarIndex_(ss) {
  var index = { dates: {}, capacity: SHOOTING_DAILY_CAPACITY_, updatedAt: new Date().toISOString() };
  try {
    ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var sheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
    if (!sheet || sheet.getLastRow() < 2) return index;
    var data = sheet.getDataRange().getValues();
    var map = getHeaderIndexMap_(data[0]);
    if (map.shootingstartdate === undefined) return index;
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Hanya officer yang boleh membebaskan tanggal — status batal saja tidak cukup.
      if (map.shootingreleasedat !== undefined && String(row[map.shootingreleasedat] || "").trim()) continue;
      var startIso = toShootingIsoDate_(row[map.shootingstartdate]);
      if (!startIso) continue;
      var days = Number(map.shootingdays !== undefined ? row[map.shootingdays] : 0) || 0;
      if (!days) {
        var endIso = map.shootingenddate !== undefined ? toShootingIsoDate_(row[map.shootingenddate]) : "";
        days = endIso ? countShootingDaysBetween_(startIso, endIso) : 1;
      }
      listShootingScheduleDates_(startIso, days).forEach(function(iso) {
        index.dates[iso] = (index.dates[iso] || 0) + 1;
      });
    }
  } catch (err) {
    Logger.log("buildShootingCalendarIndex_ gagal: " + err.message);
  }
  return index;
}

function countShootingDaysBetween_(startIso, endIso) {
  var start = parseIsoDateOnly_(startIso);
  var end = parseIsoDateOnly_(endIso);
  if (!start || !end) return 1;
  var diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (diff < 1) return 1;
  return diff > 30 ? 30 : diff;
}

function getShootingCalendarIndex_(ss) {
  var cached = getCache_(CACHE_KEY_SHOOTING_CALENDAR);
  if (cached && cached.dates) return cached;
  var index = buildShootingCalendarIndex_(ss);
  putCache_(CACHE_KEY_SHOOTING_CALENDAR, index);
  return index;
}

// Booking baru cukup menambah tanggalnya ke index yang sudah tercache — tanpa ini,
// setiap submit memaksa scan ulang sheet Leads saat kalender dibuka lagi.
function markShootingDatesBooked_(schedule) {
  try {
    var index = getCache_(CACHE_KEY_SHOOTING_CALENDAR);
    if (!index || !index.dates) return;
    listShootingScheduleDates_(schedule.shootingStartDate, schedule.shootingDays).forEach(function(iso) {
      index.dates[iso] = (index.dates[iso] || 0) + 1;
    });
    index.updatedAt = new Date().toISOString();
    putCache_(CACHE_KEY_SHOOTING_CALENDAR, index);
  } catch (e) {}
}

function findShootingDateConflicts_(schedule, index) {
  index = index || getShootingCalendarIndex_();
  var capacity = Number(index.capacity || SHOOTING_DAILY_CAPACITY_) || 1;
  var taken = index.dates || {};
  return listShootingScheduleDates_(schedule.shootingStartDate, schedule.shootingDays).filter(function(iso) {
    return Number(taken[iso] || 0) >= capacity;
  });
}

/**
 * Lepas / tarik kembali penguasaan tanggal shooting sebuah project.
 * Project yang batal tetap memegang tanggalnya sampai officer melepas di sini.
 */
function setShootingReleaseState_(accessKey, projectId, released, reason) {
  var ctx = requireInternalRole_(accessKey);
  projectId = normalizeProjectId_(projectId);
  if (!projectId) return { success: false, error: "Project ID tidak valid." };

  var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var sheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
  if (!sheet) return { success: false, error: "Sheet Leads tidak bisa diakses." };
  migrateLeadsSheetColumns_(sheet);

  var data = sheet.getDataRange().getValues();
  var map = getHeaderIndexMap_(data[0]);
  if (map.shootingreleasedat === undefined || map.shootingreleasedby === undefined) {
    return { success: false, error: "Kolom pelepasan jadwal belum tersedia di sheet Leads." };
  }
  var idIdx = map.id !== undefined ? map.id : 0;

  for (var i = 1; i < data.length; i++) {
    if (normalizeProjectId_(data[i][idIdx]) !== projectId) continue;
    var startIso = toShootingIsoDate_(data[i][map.shootingstartdate]);
    if (!startIso) return { success: false, error: "Project ini belum punya jadwal shooting." };
    var stamp = released ? new Date().toLocaleString("id-ID") : "";
    var actor = released
      ? ((ctx.name || ctx.email || "Internal Team") + (reason ? " — " + String(reason).trim() : ""))
      : "";
    sheet.getRange(i + 1, map.shootingreleasedat + 1).setValue(stamp);
    sheet.getRange(i + 1, map.shootingreleasedby + 1).setValue(sanitizeSheetCell_(actor));
    // Kalender harus dibangun ulang supaya tanggalnya benar-benar bebas/terisi lagi.
    invalidateCache_(CACHE_KEY_SHOOTING_CALENDAR);
    invalidateClientPortalCaches_();
    return {
      success: true,
      projectId: projectId,
      released: !!released,
      releasedAt: stamp,
      releasedBy: actor,
      shootingDates: listShootingScheduleDates_(
        startIso,
        Number(data[i][map.shootingdays] || 0) || countShootingDaysBetween_(startIso, toShootingIsoDate_(data[i][map.shootingenddate]))
      )
    };
  }
  return { success: false, error: "Project ID tidak ditemukan." };
}

/** Bebaskan tanggal shooting project (mis. setelah project batal). Internal only. */
function releaseShootingSchedule(accessKey, projectId, reason) {
  try {
    return setShootingReleaseState_(accessKey, projectId, true, reason);
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** Batalkan pelepasan — project kembali memegang tanggalnya. Internal only. */
function reclaimShootingSchedule(accessKey, projectId) {
  try {
    var result = setShootingReleaseState_(accessKey, projectId, false, "");
    if (!result.success) return result;
    // Index sudah memuat project ini lagi, jadi bentrok = hitungan melebihi kapasitas.
    var index = buildShootingCalendarIndex_();
    putCache_(CACHE_KEY_SHOOTING_CALENDAR, index);
    var capacity = Number(index.capacity || SHOOTING_DAILY_CAPACITY_) || 1;
    var overbooked = (result.shootingDates || []).filter(function(iso) {
      return Number((index.dates || {})[iso] || 0) > capacity;
    });
    if (overbooked.length) {
      result.warning = "Tanggal berikut sekarang dipegang lebih dari satu project: " + overbooked.join(", ") + ".";
    }
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Tanggal shooting yang sudah penuh, untuk kalender di form booking.
 * Hanya mengembalikan tanggal (tanpa data klien lain) demi privasi.
 */
function getShootingAvailability(accessKey) {
  try {
    requireLoginRole_(accessKey);
    var index = getShootingCalendarIndex_();
    var capacity = Number(index.capacity || SHOOTING_DAILY_CAPACITY_) || 1;
    var taken = index.dates || {};
    var booked = Object.keys(taken).filter(function(iso) {
      return Number(taken[iso] || 0) >= capacity;
    });
    booked.sort();
    return { success: true, bookedDates: booked, capacity: capacity };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function addClientIntake(formData) {
  try {
    var ss    = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    initializeGoogleSheets_(ss);
    var sheet = ss.getSheetByName(CONFIG.SHEET_CLIENTS);
    var intakeEmail = String(formData.email || "").trim().toLowerCase();
    var brandName = String(formData.brandName || formData.clientName || "").trim();
    var sessionOwnsEmail = isClientSessionEmail_(formData.accessKey || formData.sessionCredential, intakeEmail);
    if (!sessionOwnsEmail) {
      return { success: false, error: "Silakan Sign In sebagai client untuk Booking Now." };
    }
    if (!checkRateLimit_("booking_submit_" + Utilities.base64EncodeWebSafe(intakeEmail), 3, 3600, intakeEmail)) {
      return { success: false, error: "Terlalu banyak submit booking dari email ini. Coba lagi nanti." };
    }

    var projectTotal = parseProjectTotal_(formData.projectTotal || formData.agreedProjectTotal || formData.budgetTotal);
    if (!projectTotal) {
      return { success: false, error: "Total harga project kesepakatan wajib diisi." };
    }
    var picName = String(formData.picName || formData.pic || "").trim();
    if (!picName) {
      return { success: false, error: "Nama PIC wajib diisi." };
    }
    var isYearbook = String(formData.serviceType || "").indexOf("Yearbook") === 0;
    var totalMurid = isYearbook ? parseProjectTotal_(formData.totalMurid) : "";
    if (isYearbook && !totalMurid) {
      return { success: false, error: "Total murid wajib diisi untuk project Yearbook & Video Angkatan." };
    }
    var schedule = normalizeShootingSchedule_(formData);
    if (schedule.error) {
      return { success: false, error: schedule.error };
    }
    var conflicts = findShootingDateConflicts_(schedule);
    if (conflicts.length) {
      var conflictLabels = conflicts.map(function(iso) {
        return formatIdLongDate_(parseIsoDateOnly_(iso));
      }).join(", ");
      return {
        success: false,
        error: "Tanggal shooting sudah dibooking project lain: " + conflictLabels + ". Silakan pilih tanggal lain.",
        shootingConflicts: conflicts
      };
    }

    var projectId = generateProjectId_(ss);
    var timestamp = new Date().toLocaleString("id-ID");
    var projectType = formData.projectType || formData.serviceType || "";
    if (!projectType && formData.serviceType) {
      projectType = formData.serviceType;
      if (formData.yearbookPack) projectType += " · " + formData.yearbookPack;
    }
    var brief = formData.briefNarrative || "";
    var budgetLabel = formData.budgetRange || formatRupiahId_(projectTotal);
    var notes = [
      "WhatsApp: " + (formData.whatsapp || "-"),
      "Mewakili: " + (formData.representativeType || "-"),
      "Layanan: " + (projectType || "-"),
      "Total Harga: " + formatRupiahId_(projectTotal),
      "PIC: " + (picName || "-")
    ];
    if (schedule.shootingDateLabel) notes.push("Jadwal Shooting: " + schedule.shootingDateLabel);
    if (totalMurid) notes.push("Total Murid: " + totalMurid);
    notes = notes.join(" | ");

    appendRowByHeader_(sheet, {
      timestamp: timestamp,
      brandName: brandName,
      whatsapp: formData.whatsapp || "",
      email: formData.email || "",
      representativeType: formData.representativeType || "",
      projectType: projectType,
      budgetRange: budgetLabel,
      projectTotal: projectTotal,
      pic: picName,
      totalMurid: totalMurid || "",
      shootingDays: schedule.shootingDays,
      shootingStartDate: schedule.shootingStartDate,
      shootingEndDate: schedule.shootingEndDate,
      shootingDateLabel: schedule.shootingDateLabel,
      briefNarrative: brief,
      emailOtpVerified: formData.emailOtpVerified ? "TRUE" : "FALSE",
      agreementAccepted: formData.agreementAccepted ? "TRUE" : "FALSE",
      pdpPolicyVersion: getPdpPolicyVersion_(formData),
      status: "New Lead",
      projectId: "#" + projectId,
      createdAt: timestamp
    });

    // Tambah juga ke sheet Leads
    var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
    if (leadsSheet) {
      migrateLeadsSheetColumns_(leadsSheet);
      appendRowByHeader_(leadsSheet, {
        id: "#" + projectId,
        client: brandName,
        category: projectType,
        status: "New Lead",
        driveUrl: "",
        timestamp: timestamp,
        pic: picName,
        notes: notes + " | Brief: " + (brief || "-"),
        email: formData.email || "",
        productionStage: "On Discuss",
        postProductionProgress: "",
        productionUpdatedAt: timestamp,
        productionUpdatedBy: "System",
        productionNotes: "Project baru masuk dengan total harga kesepakatan " + formatRupiahId_(projectTotal) + ".",
        projectTotal: projectTotal,
        totalMurid: totalMurid || "",
        shootingDays: schedule.shootingDays,
        shootingStartDate: schedule.shootingStartDate,
        shootingEndDate: schedule.shootingEndDate,
        shootingDateLabel: schedule.shootingDateLabel
      });
      // Pastikan lead benar-benar ada (jaga-jaga header sheet lama tidak standar).
      ensureLeadExistsFromIntake_(ss, "#" + projectId, {
        brandName: brandName,
        projectType: projectType,
        status: "New Lead",
        whatsapp: formData.whatsapp || "",
        representativeType: formData.representativeType || "",
        projectTotal: projectTotal,
        pic: picName,
        totalMurid: totalMurid || "",
        shootingDays: schedule.shootingDays,
        shootingStartDate: schedule.shootingStartDate,
        shootingEndDate: schedule.shootingEndDate,
        shootingDateLabel: schedule.shootingDateLabel,
        briefNarrative: brief,
        email: formData.email || "",
        timestamp: timestamp,
        createdAt: timestamp
      });
    }

    // Kirim notifikasi internal agar project segera ditindaklanjuti di Operation System.
    formData.shootingDays = schedule.shootingDays;
    formData.shootingStartDate = schedule.shootingStartDate;
    formData.shootingEndDate = schedule.shootingEndDate;
    formData.shootingDateLabel = schedule.shootingDateLabel;
    sendIntakeNotification_(formData, projectId, projectTotal);
    CacheService.getScriptCache().remove(getBookingEmailVerifiedCacheKey_(intakeEmail));
    markShootingDatesBooked_(schedule);
    // Lead sudah ditulis ke sheet — buang cache ops/agenda supaya Client Status
    // dan inbox baca data yang sama. Jangan sentuh CACHE_KEY_SHOOTING_CALENDAR
    // (sudah di-patch oleh markShootingDatesBooked_) atau BACKFILL_DONE.
    invalidateCache_(CACHE_KEY_OPERATION, CACHE_KEY_APPROVALS, CACHE_KEY_PRODOPS);
    invalidateClientPortalCaches_();

    return {
      success: true,
      projectId: "#" + projectId,
      projectTotal: projectTotal,
      shootingDates: listShootingScheduleDates_(schedule.shootingStartDate, schedule.shootingDays),
      shootingDateLabel: schedule.shootingDateLabel
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── UPDATE STATUS LEAD ──────────────────────────────────────
function updateLeadStatus_(accessKey, projectId, newStatus, notes, changedBy) {
  try {
    requireInternalRole_(accessKey);
    projectId = normalizeProjectId_(projectId);
    newStatus = String(newStatus || "").trim();
    var ss    = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var sheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
    var data  = sheet.getDataRange().getValues();
    var headers = data[0] || [];
    var headerMap = getHeaderIndexMap_(headers);
    var idCol = headerMap.id !== undefined ? headerMap.id : 0;
    var statusCol = headerMap.status !== undefined ? headerMap.status : 3;

    for (var i = 1; i < data.length; i++) {
      if (sameProjectId_(data[i][idCol], projectId)) {
        var oldStatus = data[i][statusCol];
        sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
        logProjectStatusChange_(ss, projectId, oldStatus, newStatus, notes || "", changedBy || "Internal Team");
        return { success: true, oldStatus: oldStatus, newStatus: newStatus };
      }
    }
    return { success: false, error: "Project ID tidak ditemukan." };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── MARK AS DEAL — update status + buat folder Drive ────────
function markAsDeal(accessKey, projectId, clientName) {
  try {
    var ctx = requireInternalRole_(accessKey);
    var actor = (ctx && (ctx.name || ctx.email)) ? (ctx.name || ctx.email) : "Internal Team";
    // 1. Update status di Sheets + catat activity log
    var statusResult = updateLeadStatus_(
      accessKey,
      projectId,
      "Deal",
      "Deal dikonfirmasi oleh admin. Folder Drive dibuat otomatis.",
      actor
    );
    if (!statusResult || !statusResult.success) {
      return { success: false, error: (statusResult && statusResult.error) || "Gagal update status Deal." };
    }

    // 2. Buat folder Drive + ACL + notifikasi (idempotent, dipakai bersama semua jalur Deal)
    var folderResult = createProjectDriveFolderForDeal_(projectId, clientName);
    var aclResult = folderResult.aclResult;
    var clientMailResult = folderResult.clientMailResult;

    return {
      success: true,
      folderUrl: folderResult.folderUrl,
      clientEmail: folderResult.clientEmail || "",
      clientEmailSent: !!(clientMailResult && clientMailResult.sent),
      driveAcl: aclResult,
      folderAclOk: !!(aclResult && aclResult.privateOk),
      driveGated: true
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Buat folder Drive untuk project yang Deal ─────────────────
// Dipakai oleh markAsDeal (tombol "Deal") maupun updateLeadStatusWithHistory
// (dropdown / quick status). Tidak membedakan Direktur vs Officer — siapa pun
// yang mengubah lead ke status "Deal" akan otomatis membuat folder Drive.
function createProjectDriveFolderForDeal_(projectId, clientName) {
  // 1. Buat folder Drive — nama = nama sekolah/project saja (tanpa kode produksi)
  var rootFolder  = DriveApp.getFolderById(getConfig_("DRIVE_FOLDER_ID"));
  var folderName = String(clientName || "").trim().toUpperCase() || "PROJECT";
  var clientFolder = rootFolder.createFolder(folderName);

  // Sub-folders standar produksi — semua jadi kartu Production Ops
  getProductionOpsFolderTemplate_().forEach(function(name) {
    var sub = clientFolder.createFolder(name);
    logDriveAsset_(projectId, "DEPT_FOLDER", sub.getUrl(), sub.getId(), name, "Leads");
  });

  var folderUrl = clientFolder.getUrl();
  logDriveAsset_(projectId, "PROJECT_FOLDER", folderUrl, clientFolder.getId(), clientFolder.getName(), "Leads");

  // 2. Simpan URL folder ke sheet & ambil email client (header-based, bukan index hardcode)
  var ss    = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var sheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
  var data  = sheet.getDataRange().getValues();
  var headers = data[0] || [];
  var headerMap = getHeaderIndexMap_(headers);
  var idIdx = headerMap.id !== undefined ? headerMap.id : 0;
  var driveIdx = headerMap.driveurl !== undefined ? headerMap.driveurl : 4;
  var emailIdx = headerMap.email;

  var clientEmail = "";
  for (var i = 1; i < data.length; i++) {
    if (sameProjectId_(data[i][idIdx], projectId)) {
      sheet.getRange(i + 1, driveIdx + 1).setValue(folderUrl);
      clientEmail = resolveClientEmail_(projectId, data[i], headers);
      // Perbaiki kolom email di Leads jika sebelumnya terisi nilai corrupt (mis. "System").
      if (clientEmail && emailIdx !== undefined && String(data[i][emailIdx] || "").trim() !== clientEmail) {
        sheet.getRange(i + 1, emailIdx + 1).setValue(clientEmail);
      }
      break;
    }
  }
  if (!clientEmail) {
    clientEmail = resolveClientEmail_(projectId, null, headers);
  }

  // 3. Isolasi akses: folder privat untuk tim FA saja.
  //    Akses klien digate — baru dibuka setelah Production Ops 100% DAN payment Lunas.
  ensureDrivePortalRootAcl_();
  var aclResult = applyProjectFolderAcl_(clientFolder, clientEmail, { shareWithClient: false });
  try {
    PropertiesService.getScriptProperties().setProperty(
      "ACL_STATE_" + normalizeProjectId_(projectId),
      "GATED"
    );
  } catch (eAclState) {
    Logger.log("ACL state cache gagal: " + eAclState.message);
  }

  // 4. Kirim notifikasi email ke client (tanpa link Drive)
  var clientMailResult = { sent: false };
  if (isValidEmail_(clientEmail)) {
    clientMailResult = sendDealNotificationToClient_(projectId, clientName, clientEmail, "") || { sent: true };
  } else {
    Logger.log("Deal email client dilewati: email tidak valid untuk " + projectId);
  }

  // 5. Kirim notifikasi ke internal (tetap sertakan link Drive)
  sendDealNotificationInternal_(projectId, clientName, folderUrl);

  return {
    folderUrl: folderUrl,
    clientEmail: clientEmail || "",
    clientMailResult: clientMailResult,
    aclResult: aclResult
  };
}

// ── INITIALIZE SHEETS — buat sheet jika belum ada ──────────────
function removeObsoleteAccessCodeSheet_(ss) {
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var sheet = ss.getSheetByName("Approved_Access");
  if (!sheet) return;
  if (ss.getSheets().length <= 1) return;
  try {
    ss.deleteSheet(sheet);
    Logger.log("Sheet 'Approved_Access' dihapus karena Access Code sudah tidak dipakai.");
  } catch (err) {
    Logger.log("Gagal hapus sheet Approved_Access: " + err.message);
  }
}

function initializeGoogleSheets_(ss) {
  // Migrasi + repair hanya perlu sesekali, bukan tiap request. Tanpa gerbang ini
  // setiap eksekusi dingin menanggung belasan detik hanya untuk cek skema.
  if (_SHEETS_LEADS_READY || isSchemaTaskDone_("leadsSchema")) {
    _SHEETS_LEADS_READY = true;
    return { success: true, message: "Sheets sudah siap (cached)" };
  }
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  removeObsoleteAccessCodeSheet_(ss);
  try { ensureClientUsersSheet_(ss); } catch (e) {
    Logger.log("ClientUsers saat init gagal: " + e.message);
  }
  try {
    
    // 1. Buat sheet "Leads" jika belum ada
    var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
    if (!leadsSheet) {
      leadsSheet = ss.insertSheet(CONFIG.SHEET_LEADS);
      leadsSheet.appendRow([
        "id", "client", "category", "status", "driveUrl", "timestamp", "pic", "notes", "email",
        "productionStage", "postProductionProgress", "productionUpdatedAt", "productionUpdatedBy", "productionNotes",
        "productionOpsData", "productionOpsUpdatedAt", "productionOpsUpdatedBy",
        "projectTotal", "totalMurid",
        "shootingDays", "shootingStartDate", "shootingEndDate", "shootingDateLabel",
        "shootingReleasedAt", "shootingReleasedBy"
      ]);
      Logger.log("✓ Sheet 'Leads' berhasil dibuat");
    } else {
      migrateLeadsSheetColumns_(leadsSheet);
    }
    
    // 2. Buat sheet "ClientIntake" jika belum ada
    var clientSheet = ss.getSheetByName(CONFIG.SHEET_CLIENTS);
    if (!clientSheet) {
      clientSheet = ss.insertSheet(CONFIG.SHEET_CLIENTS);
      clientSheet.appendRow([
        "timestamp", "brandName", "whatsapp", "email", "representativeType",
        "projectType", "budgetRange", "projectTotal", "pic", "totalMurid",
        "shootingDays", "shootingStartDate", "shootingEndDate", "shootingDateLabel",
        "briefNarrative",
        "emailOtpVerified", "agreementAccepted", "pdpPolicyVersion", "status", "projectId", "createdAt"
      ]);
      Logger.log("✓ Sheet 'ClientIntake' berhasil dibuat");
    } else {
      migrateClientIntakeSheetColumns_(clientSheet);
    }
    
    // 3. Buat sheet "StatusHistory" jika belum ada
    ensureStatusHistorySheet_(ss);

    var prodHistorySheet = ss.getSheetByName(CONFIG.SHEET_PROD_HIST);
    if (!prodHistorySheet) {
      prodHistorySheet = ss.insertSheet(CONFIG.SHEET_PROD_HIST);
      prodHistorySheet.appendRow(["timestamp", "projectId", "oldStage", "newStage", "oldProgress", "newProgress", "notes", "updatedBy"]);
      Logger.log("✓ Sheet 'ProductionProgressHistory' berhasil dibuat");
    }

    ensureDriveAssetsSheet_(ss);
    ensureProductionDeptApprovalsSheet_(ss);
    ensureUsersSheet_(ss);
    // repairLeadsMissingPic_ menulis sel per-baris dan tidak boleh berada di
    // jalur baca dashboard. Jalankan dari editor Apps Script bila perlu.

    _SHEETS_LEADS_READY = true;
    markSchemaTaskDone_("leadsSchema");
    return { success: true, message: "Sheets sudah siap" };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function initializeGoogleSheets(accessKey) {
  try {
    requireInternalRole_(accessKey);
    return initializeGoogleSheets_();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function migrateLeadsSheetColumns_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  var rawHeaders = headerRange.getValues()[0];
  var headers = rawHeaders.map(function(h) {
    return String(h || "").trim();
  });
  // Bersihkan header cell yang punya whitespace tersembunyi (mis. " pic") agar pembacaan data konsisten.
  var needsCleanup = rawHeaders.some(function(h, idx) { return String(h || "") !== headers[idx]; });
  if (needsCleanup) headerRange.setValues([headers]);
  var lower = headers.map(function(h) { return h.toLowerCase(); });
  [
    "email",
    "pic",
    "driveUrl",
    "productionStage",
    "postProductionProgress",
    "productionUpdatedAt",
    "productionUpdatedBy",
    "productionNotes",
    "productionOpsData",
    "productionOpsUpdatedAt",
    "productionOpsUpdatedBy",
    "projectTotal",
    "totalMurid",
    "shootingDays",
    "shootingStartDate",
    "shootingEndDate",
    "shootingDateLabel",
    "shootingReleasedAt",
    "shootingReleasedBy"
  ].forEach(function(header) {
    if (lower.indexOf(header.toLowerCase()) < 0) {
      var newCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, newCol).setValue(header);
      headers.push(header);
      lower.push(header.toLowerCase());
    }
  });
}

// ── SYNC LEADS ADVANCED — dengan statistik ──────────────────
function syncLeadsAdvanced(accessKey) {
  try {
    requireInternalRole_(accessKey);
    // 1. Pastikan sheets sudah ada
    initializeGoogleSheets_();
    
    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var sheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
    if (!sheet) return { success: false, error: "Sheet Leads tidak bisa diakses" };

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, leads: [], totalCount: 0, syncTimestamp: new Date().toISOString() };
    }

    var headers = data[0];
    var leads = [];
    var statusCount = {
      "New Lead": 0,
      "In Progress": 0,
      "Deal": 0,
      "In-Production": 0,
      "Done": 0,
      "On Hold": 0,
      "Completed": 0,
      "Rejected": 0
    };

    data.slice(1).forEach(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { 
        // Normalize header ke lowercase untuk consistency
        var key = h.toString().trim().toLowerCase();
        obj[key] = row[i]; 
      });
      
      leads.push(obj);
      
      // Count status (menggunakan lowercase key)
      var status = obj["status"] || "Unknown";
      if (statusCount[status] !== undefined) {
        statusCount[status]++;
      }
    });

    return { 
      success: true, 
      leads: leads,
      totalCount: leads.length,
      statusBreakdown: statusCount,
      syncTimestamp: new Date().toISOString()
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── UPDATE STATUS WITH HISTORY ─────────────────────────────────
function ensureStatusHistorySheet_(ss) {
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var sheet = ss.getSheetByName("StatusHistory");
  if (!sheet) {
    sheet = ss.insertSheet("StatusHistory");
    sheet.appendRow(["timestamp", "projectId", "oldStatus", "newStatus", "notes", "changedBy"]);
    return sheet;
  }

  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || "").trim();
  });
  var lower = headers.map(function(h) { return h.toLowerCase(); });
  ["timestamp", "projectId", "oldStatus", "newStatus", "notes", "changedBy"].forEach(function(header) {
    if (lower.indexOf(header.toLowerCase()) < 0) {
      sheet.insertColumnAfter(sheet.getLastColumn());
      sheet.getRange(1, sheet.getLastColumn()).setValue(header);
      lower.push(header.toLowerCase());
    }
  });
  return sheet;
}

function sameProjectId_(a, b) {
  return normalizeProjectId_(a) === normalizeProjectId_(b);
}

/**
 * Catat perubahan status project ke StatusHistory (sumber Activity Log + Client Portal tracking).
 */
function logProjectStatusChange_(ss, projectId, oldStatus, newStatus, notes, changedBy) {
  projectId = normalizeProjectId_(projectId);
  if (!projectId) return;
  oldStatus = String(oldStatus == null ? "" : oldStatus).trim();
  newStatus = String(newStatus == null ? "" : newStatus).trim();
  if (!newStatus || oldStatus === newStatus) return;

  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var historySheet = ensureStatusHistorySheet_(ss);
  var headers = historySheet.getRange(1, 1, 1, historySheet.getLastColumn()).getValues()[0];
  var headerMap = getHeaderIndexMap_(headers);
  var row = [];
  for (var c = 0; c < headers.length; c++) row.push("");

  function setCol_(key, value, fallbackIdx) {
    var idx = headerMap[key];
    if (idx === undefined) idx = fallbackIdx;
    if (idx === undefined || idx < 0 || idx >= row.length) return;
    row[idx] = value;
  }

  setCol_("timestamp", new Date().toLocaleString("id-ID"), 0);
  setCol_("projectid", projectId, 1);
  setCol_("oldstatus", oldStatus || "-", 2);
  setCol_("newstatus", newStatus, 3);
  setCol_("notes", String(notes || "").trim(), 4);
  setCol_("changedby", String(changedBy || "Internal Team").trim(), 5);

  historySheet.appendRow(row);
}

function updateLeadStatusWithHistory(accessKey, projectId, newStatus, notes, deferSideEffects) {
  try {
    var ctx = requireInternalRole_(accessKey);
    projectId = normalizeProjectId_(projectId);
    newStatus = String(newStatus || "").trim();
    if (!projectId) return { success: false, error: "Project ID wajib diisi." };
    if (!newStatus) return { success: false, error: "Status baru wajib diisi." };

    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
    if (!leadsSheet || leadsSheet.getLastRow() < 2) {
      return { success: false, error: "Sheet Leads kosong." };
    }

    var headers = leadsSheet.getRange(1, 1, 1, leadsSheet.getLastColumn()).getValues()[0];
    var headerMap = getHeaderIndexMap_(headers);
    var idCol = headerMap.id !== undefined ? headerMap.id : 0;
    var statusCol = headerMap.status !== undefined ? headerMap.status : 3;

    var lastRow = leadsSheet.getLastRow();
    var idRange = leadsSheet.getRange(2, idCol + 1, lastRow, idCol + 1);
    var finder = idRange.createTextFinder(projectId).matchEntireCell(true);
    var match = finder.findNext();
    var rowIndex = -1;
    var oldStatus = null;

    if (match) {
      rowIndex = match.getRow();
      oldStatus = leadsSheet.getRange(rowIndex, statusCol + 1).getValue();
    } else {
      // Fallback scan dengan normalize (antisipasi perbedaan # / spasi)
      var idValues = idRange.getValues();
      for (var i = 0; i < idValues.length; i++) {
        if (normalizeProjectId_(idValues[i][0]) === projectId) {
          rowIndex = i + 2;
          oldStatus = leadsSheet.getRange(rowIndex, statusCol + 1).getValue();
          break;
        }
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: "Project ID tidak ditemukan" };
    }

    if (String(oldStatus || "") === newStatus) {
      return {
        success: true,
        projectId: projectId,
        oldStatus: oldStatus,
        newStatus: newStatus,
        changedAt: new Date().toISOString(),
        unchanged: true
      };
    }

    leadsSheet.getRange(rowIndex, statusCol + 1).setValue(newStatus);

    var actor = (ctx && (ctx.name || ctx.email)) ? (ctx.name || ctx.email) : "Internal Team";
    var historyNotes = String(notes || "").trim() || ("Status diubah oleh admin: " + actor);
    logProjectStatusChange_(ss, projectId, oldStatus, newStatus, historyNotes, actor);

    var rowValues = leadsSheet.getRange(rowIndex, 1, rowIndex, leadsSheet.getLastColumn()).getValues()[0];

    // Folder Drive + email bisa makan belasan detik. Kalau client minta ditunda,
    // status langsung dibalas dulu dan sisanya dikerjakan lewat finishLeadStatusChange().
    if (deferSideEffects) {
      patchLeadStatusInCaches_(projectId, newStatus);
      return {
        success: true,
        projectId: projectId,
        oldStatus: oldStatus,
        newStatus: newStatus,
        changedAt: new Date().toISOString(),
        deferred: true
      };
    }

    var sideEffects = applyLeadStatusSideEffects_({
      ctx: ctx,
      projectId: projectId,
      rowValues: rowValues,
      headers: headers,
      headerMap: headerMap,
      oldStatus: oldStatus,
      newStatus: newStatus,
      notes: notes,
      actor: actor
    });

    patchLeadStatusInCaches_(projectId, newStatus, sideEffects.folderUrl);
    return {
      success: true,
      projectId: projectId,
      oldStatus: oldStatus,
      newStatus: newStatus,
      changedAt: new Date().toISOString(),
      clientEmail: sideEffects.clientEmail,
      clientEmailSent: sideEffects.clientEmailSent,
      clientEmailReason: sideEffects.clientEmailReason,
      folderUrl: sideEffects.folderUrl
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Buat folder Drive (khusus transisi ke Deal) + kirim notifikasi ke client.
function applyLeadStatusSideEffects_(opts) {
  var projectId = opts.projectId;
  var headerMap = opts.headerMap;
  var rowValues = opts.rowValues;
  var clientName = String(
    getRowValueByHeader_(rowValues, headerMap, ["client", "clientname", "brandname"], "") || "Client"
  ).trim() || "Client";
  var clientEmail = resolveClientEmail_(projectId, rowValues, opts.headers);

  // Idempotent: folder hanya dibuat kalau lead ini belum punya folder Drive.
  var driveIdxLead = headerMap.driveurl;
  var existingDrive = driveIdxLead !== undefined ? String(rowValues[driveIdxLead] || "").trim() : "";
  if (!existingDrive) existingDrive = findDriveUrlInLeadRow_(rowValues, headerMap) || "";
  var dealFolderResult = null;
  if (/^deal$/i.test(opts.newStatus) && !existingDrive) {
    try {
      dealFolderResult = createProjectDriveFolderForDeal_(projectId, clientName);
    } catch (dealErr) {
      Logger.log("Auto-create folder Drive saat Deal gagal: " + dealErr.message);
    }
  }

  // Saat folder Deal dibuat, notifikasi Deal (tanpa link Drive ke klien) sudah dikirim
  // di dalam helper — jangan kirim email status generic agar tidak dobel.
  var clientMail;
  if (dealFolderResult) {
    clientMail = dealFolderResult.clientMailResult || { sent: false };
    clientEmail = dealFolderResult.clientEmail || clientEmail;
  } else {
    clientMail = sendProjectStatusNotificationToClient_({
      projectId: projectId,
      clientName: clientName,
      clientEmail: clientEmail,
      oldStatus: opts.oldStatus,
      newStatus: opts.newStatus,
      notes: String(opts.notes || "").trim(),
      changedBy: opts.actor
    });
  }

  return {
    clientName: clientName,
    clientEmail: clientEmail || "",
    clientEmailSent: !!(clientMail && clientMail.sent),
    clientEmailReason: (clientMail && clientMail.reason) || "",
    folderUrl: dealFolderResult ? dealFolderResult.folderUrl : "",
    folderAclOk: dealFolderResult ? !!(dealFolderResult.aclResult && dealFolderResult.aclResult.privateOk) : null
  };
}

// Lanjutan dari updateLeadStatusWithHistory(..., deferSideEffects = true).
// Dipanggil client tanpa memblokir UI.
function finishLeadStatusChange(accessKey, projectId, oldStatus, newStatus, notes) {
  try {
    var ctx = requireInternalRole_(accessKey);
    projectId = normalizeProjectId_(projectId);
    newStatus = String(newStatus || "").trim();
    if (!projectId || !newStatus) {
      return { success: false, error: "Project ID dan status baru wajib diisi." };
    }

    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
    if (!leadsSheet || leadsSheet.getLastRow() < 2) {
      return { success: false, error: "Sheet Leads kosong." };
    }
    var data = leadsSheet.getDataRange().getValues();
    var headers = data[0] || [];
    var headerMap = getHeaderIndexMap_(headers);
    var idCol = headerMap.id !== undefined ? headerMap.id : 0;
    var rowValues = null;
    for (var i = 1; i < data.length; i++) {
      if (sameProjectId_(data[i][idCol], projectId)) {
        rowValues = data[i];
        break;
      }
    }
    if (!rowValues) return { success: false, error: "Project ID tidak ditemukan" };

    var actor = (ctx && (ctx.name || ctx.email)) ? (ctx.name || ctx.email) : "Internal Team";
    var sideEffects = applyLeadStatusSideEffects_({
      ctx: ctx,
      projectId: projectId,
      rowValues: rowValues,
      headers: headers,
      headerMap: headerMap,
      oldStatus: oldStatus,
      newStatus: newStatus,
      notes: notes,
      actor: actor
    });

    patchLeadStatusInCaches_(projectId, newStatus, sideEffects.folderUrl);
    return {
      success: true,
      projectId: projectId,
      newStatus: newStatus,
      clientEmail: sideEffects.clientEmail,
      clientEmailSent: sideEffects.clientEmailSent,
      clientEmailReason: sideEffects.clientEmailReason,
      folderUrl: sideEffects.folderUrl,
      folderAclOk: sideEffects.folderAclOk
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function updateProductionProgress(accessKey, projectId, stage, postProgress, notes) {
  var ctx = requireInternalRole_(accessKey);
  try {
    initializeGoogleSheets_();
    projectId = normalizeProjectId_(projectId);
    stage = normalizeProductionStage_(stage);
    notes = String(notes || "").trim();
    // Sub-progress post production dihapus — hanya 4 stage.
    postProgress = "";
    if (!projectId) return { success: false, error: "Project ID wajib diisi." };
    if (!stage) return { success: false, error: "Stage produksi tidak valid." };

    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
    migrateLeadsSheetColumns_(leadsSheet);
    var data = leadsSheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h || "").trim(); });
    var projectCol = headers.indexOf("id");
    if (projectCol < 0) projectCol = 0;
    var stageCol = headers.indexOf("productionStage");
    var progressCol = headers.indexOf("postProductionProgress");
    var updatedAtCol = headers.indexOf("productionUpdatedAt");
    var updatedByCol = headers.indexOf("productionUpdatedBy");
    var notesCol = headers.indexOf("productionNotes");
    var rowIndex = -1;
    var oldStage = "";
    var oldProgress = "";

    for (var i = 1; i < data.length; i++) {
      if (normalizeProjectId_(data[i][projectCol]) === projectId) {
        rowIndex = i;
        oldStage = data[i][stageCol] || "";
        oldProgress = progressCol >= 0 ? (data[i][progressCol] || "") : "";
        break;
      }
    }
    if (rowIndex < 0) return { success: false, error: "Project ID tidak ditemukan." };
    if (stageCol < 0 || updatedAtCol < 0 || updatedByCol < 0 || notesCol < 0) {
      return { success: false, error: "Kolom production belum tersedia di sheet. Coba jalankan 'Initialize Sheets' terlebih dahulu." };
    }

    var timestamp = new Date().toLocaleString("id-ID");
    leadsSheet.getRange(rowIndex + 1, stageCol + 1).setValue(stage);
    if (progressCol >= 0) leadsSheet.getRange(rowIndex + 1, progressCol + 1).setValue("");
    leadsSheet.getRange(rowIndex + 1, updatedAtCol + 1).setValue(timestamp);
    leadsSheet.getRange(rowIndex + 1, updatedByCol + 1).setValue(ctx.email || "");
    leadsSheet.getRange(rowIndex + 1, notesCol + 1).setValue(sanitizeSheetCell_(notes));

    var histSheet = ss.getSheetByName(CONFIG.SHEET_PROD_HIST);
    if (!histSheet) {
      histSheet = ss.insertSheet(CONFIG.SHEET_PROD_HIST);
      histSheet.appendRow(["timestamp", "projectId", "oldStage", "newStage", "oldProgress", "newProgress", "notes", "updatedBy"]);
    }
    histSheet.appendRow([timestamp, projectId, oldStage, stage, oldProgress, "", sanitizeSheetCell_(notes), ctx.email || ""]);

    var production = buildProductionProgressPayload_(stage, "", timestamp, ctx.email || "", notes);
    var leadForPercent = getLeadByProjectId_(projectId);
    var opsPercent = getProductionOpsPercentFromLead_(leadForPercent);
    if (opsPercent !== null && opsPercent !== undefined) {
      production.overallPercent = opsPercent;
    }
    var notification = { sent: false, reason: "" };
    var stageChanged = normalizeProductionStage_(oldStage) !== stage;
    if (stageChanged) {
      var lead = leadForPercent || getLeadByProjectId_(projectId);
      notification = sendProductionProgressNotificationToClient_({
        projectId: projectId,
        clientName: lead ? lead.clientName : "",
        clientEmail: lead ? lead.clientEmail : "",
        category: lead ? lead.category : "",
        stage: stage,
        postProgress: "",
        overallPercent: production.overallPercent,
        notes: notes,
        updatedAt: timestamp
      });
    } else {
      notification.reason = "Status produksi tidak berubah.";
    }

    invalidateAllDataCaches_();
    return {
      success: true,
      projectId: projectId,
      production: production,
      notification: notification
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function normalizeProductionStage_(stage) {
  stage = String(stage || "").trim();
  var map = {
    "On Discuss": "On Discuss",
    "On Discuss with FA Team": "On Discuss",
    "Production/Shooting": "Production/Shooting",
    "Production / Shooting": "Production/Shooting",
    "Post Production": "Post Production",
    "Project Selesai": "Project Selesai"
  };
  return map[stage] || "";
}

function normalizePostProductionProgress_(progress) {
  // Legacy helper — sub-progress sudah tidak dipakai.
  return "";
}

function getProductionOverallPercent_(stage) {
  stage = normalizeProductionStage_(stage);
  if (stage === "On Discuss") return 25;
  if (stage === "Production/Shooting") return 50;
  if (stage === "Post Production") return 75;
  if (stage === "Project Selesai") return 100;
  return 0;
}

function getProductionOpsFolderTemplate_() {
  return [
    "Marketing",
    "Final Video",
    "Sound Man",
    "Foto Angkatan",
    "Foto Perkelas",
    "Foto Random",
    "Tiktok Video"
  ];
}

function slugifyFolderName_(name) {
  return String(name || "").trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeOpsFolderIcon_(label) {
  var parts = String(label || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "OP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function sortOpsFolderCatalog_(catalog) {
  catalog = catalog || [];
  var order = {};
  getProductionOpsFolderTemplate_().forEach(function(name, index) {
    order[slugifyFolderName_(name)] = index;
  });
  return catalog.slice().sort(function(a, b) {
    var ao = order[a.id] !== undefined ? order[a.id] : 999;
    var bo = order[b.id] !== undefined ? order[b.id] : 999;
    if (ao !== bo) return ao - bo;
    return String(a.label || "").localeCompare(String(b.label || ""));
  }).map(function(item, index) {
    item.order = index + 1;
    return item;
  });
}

function getDefaultProductionOpsDepartments_() {
  return getProductionOpsFolderTemplate_().map(function(name, index) {
    return {
      id: slugifyFolderName_(name),
      label: name,
      icon: makeOpsFolderIcon_(name),
      pic: "",
      status: "Belum Mulai",
      progress: 0,
      order: index + 1
    };
  });
}

function normalizeProductionOpsStatus_(status) {
  status = String(status || "").trim().toLowerCase();
  if (status === "done" || status === "selesai") return "Done";
  if (status === "on progress" || status === "in progress" || status === "progress") return "On Progress";
  if (status === "menunggu review" || status === "review" || status === "on review") return "Menunggu Review";
  return "Belum Mulai";
}

function normalizeProductionOpsPercent_(value, fallbackStatus) {
  var num = Number(value);
  var status = normalizeProductionOpsStatus_(fallbackStatus);
  if (!isFinite(num)) {
    if (status === "Done") return 100;
    if (status === "Menunggu Review") return 85;
    if (status === "On Progress") return 35;
    return 0;
  }
  num = Math.max(0, Math.min(100, Math.round(num)));
  if (status === "Done" && num < 100) num = 100;
  return num;
}

function normalizeProductionOpsItem_(raw, defaults, index) {
  raw = raw || {};
  defaults = defaults || {};
  var status = normalizeProductionOpsStatus_(raw.status || defaults.status);
  var approvalStatus = String(raw.approvalStatus || raw.approvalstatus || defaults.approvalStatus || "").trim().toUpperCase();
  if (approvalStatus && ["PENDING", "APPROVED", "REJECTED", "CANCELLED"].indexOf(approvalStatus) < 0) {
    approvalStatus = "";
  }
  return {
    id: String(raw.id || defaults.id || ("dept-" + index)).trim(),
    label: String(raw.label || defaults.label || ("Department " + (index + 1))).trim(),
    icon: String(raw.icon || defaults.icon || "OP").trim(),
    pic: String(raw.pic || defaults.pic || "").trim(),
    status: status,
    progress: normalizeProductionOpsPercent_(raw.progress, status),
    note: String(raw.note || "").trim(),
    updatedAt: String(raw.updatedAt || raw.updatedat || "").trim(),
    approvalStatus: approvalStatus,
    approvalId: String(raw.approvalId || raw.approvalid || defaults.approvalId || "").trim(),
    reviewNotes: String(raw.reviewNotes || raw.reviewnotes || defaults.reviewNotes || "").trim(),
    pendingProgress: raw.pendingProgress != null && raw.pendingProgress !== ""
      ? Math.max(0, Math.min(100, Math.round(Number(raw.pendingProgress))))
      : (raw.pendingprogress != null && raw.pendingprogress !== ""
        ? Math.max(0, Math.min(100, Math.round(Number(raw.pendingprogress))))
        : ""),
    pendingStatus: String(raw.pendingStatus || raw.pendingstatus || "").trim(),
    pendingPic: String(raw.pendingPic || raw.pendingpic || "").trim(),
    pendingNote: String(raw.pendingNote || raw.pendingnote || "").trim(),
    order: Number(raw.order || defaults.order || (index + 1)) || (index + 1)
  };
}

function normalizeProductionOpsData_(value, folders) {
  var raw = value;
  if (typeof raw === "string") {
    try {
      raw = raw ? JSON.parse(raw) : [];
    } catch (e) {
      raw = [];
    }
  }
  if (!Array.isArray(raw)) raw = [];
  folders = Array.isArray(folders) && folders.length ? folders : getDefaultProductionOpsDepartments_();
  var byId = {};
  raw.forEach(function(item) {
    var key = String((item && item.id) || "").trim().toLowerCase();
    if (key) byId[key] = item;
    var labelKey = slugifyFolderName_((item && item.label) || "");
    if (labelKey && !byId[labelKey]) byId[labelKey] = item;
  });
  return folders.map(function(folder, index) {
    var folderId = String(folder.id || slugifyFolderName_(folder.label || "")).trim();
    var saved = byId[folderId] || byId[slugifyFolderName_(folder.label || "")] || {};
    return normalizeProductionOpsItem_(saved, {
      id: folderId,
      label: folder.label || folder.name || ("Folder " + (index + 1)),
      icon: folder.icon || makeOpsFolderIcon_(folder.label || folder.name || ""),
      pic: "",
      status: "Belum Mulai",
      progress: 0,
      order: folder.order || (index + 1),
      folderUrl: folder.url || ""
    }, index);
  });
}

function isDeptFullyValidated_(item) {
  item = item || {};
  if (Number(item.progress || 0) < 100) return false;
  var approval = String(item.approvalStatus || "").trim().toUpperCase();
  if (approval === "APPROVED") return true;
  if (approval === "PENDING" || approval === "REJECTED" || approval === "CANCELLED") return false;
  return normalizeProductionOpsStatus_(item.status) === "Done";
}

function getClientDeptPublicStatus_(item) {
  item = item || {};
  if (isDeptFullyValidated_(item)) {
    return { key: "done", label: "Selesai" };
  }
  var approval = String(item.approvalStatus || "").trim().toUpperCase();
  var status = normalizeProductionOpsStatus_(item.status);
  if (approval === "PENDING" || status === "Menunggu Review") {
    return { key: "review", label: "Finalisasi" };
  }
  if (Number(item.progress || 0) > 0 || status === "On Progress") {
    return { key: "progress", label: "Proses" };
  }
  return { key: "pending", label: "Belum mulai" };
}

function buildClientProductionOpsReport_(lead) {
  lead = lead || {};
  var projectId = normalizeProjectId_(lead.projectId || lead.id || "");
  var folderCatalog = [];
  try {
    folderCatalog = getOpsFolderCatalogForProject_(projectId);
  } catch (e) {
    folderCatalog = [];
  }
  var items = normalizeProductionOpsData_(
    lead.productionOpsData,
    folderCatalog.length ? folderCatalog : getDefaultProductionOpsDepartments_()
  );
  var summary = getProductionOpsSummary_(items);
  var departments = items.map(function(item) {
    var pub = getClientDeptPublicStatus_(item);
    return {
      id: item.id,
      label: item.label,
      progress: Number(item.progress || 0),
      statusKey: pub.key,
      statusLabel: pub.label,
      done: pub.key === "done"
    };
  });
  var doneCount = departments.filter(function(d) { return d.done; }).length;
  return {
    overallPercent: summary.overallPercent,
    stage: summary.stage || normalizeProductionStage_(lead.productionStage) || "On Discuss",
    updatedAt: formatCellValue_(lead.productionOpsUpdatedAt || lead.productionUpdatedAt || ""),
    doneCount: doneCount,
    totalCount: departments.length,
    departments: departments
  };
}

function getProductionOpsSummary_(items) {
  items = Array.isArray(items) ? items : normalizeProductionOpsData_(items);
  if (!items.length) return { overallPercent: 0, stage: "On Discuss" };
  var total = items.reduce(function(sum, item) {
    return sum + Number(item.progress || 0);
  }, 0);
  var overallPercent = Math.round(total / items.length);
  var byId = {};
  items.forEach(function(item) { byId[item.id] = item; });
  var finalVideo = byId["final-video"] || {};
  var shootStarted = items.some(function(item) {
    if (item.id === "marketing") return false;
    return Number(item.progress || 0) > 0;
  });
  var allDone = items.every(function(item) { return isDeptFullyValidated_(item); });
  var stage = "On Discuss";
  if (allDone || (overallPercent >= 100 && allDone)) stage = "Project Selesai";
  else if (Number(finalVideo.progress || 0) > 0 || overallPercent >= 70) stage = "Post Production";
  else if (shootStarted || overallPercent >= 25) stage = "Production/Shooting";
  return { overallPercent: overallPercent, stage: stage };
}

function stringifyProductionOpsData_(items, folders) {
  return JSON.stringify(normalizeProductionOpsData_(items, folders));
}

function buildProductionProgressPayload_(stage, postProgress, updatedAt, updatedBy, notes) {
  stage = normalizeProductionStage_(stage) || "On Discuss";
  return {
    stage: stage,
    postProgress: "",
    overallPercent: getProductionOverallPercent_(stage),
    updatedAt: formatCellValue_(updatedAt),
    updatedBy: String(updatedBy || ""),
    notes: String(notes || "")
  };
}

function requiresDeptDirectorValidation_(ctx) {
  return ctx && ctx.role !== "DIRECTOR";
}

function deptItemHasSubmissionChanges_(old, item) {
  old = old || {};
  item = item || {};
  if (Number(item.pendingProgress || 0) !== Number(old.pendingProgress || 0)) return true;
  return normalizeProductionOpsStatus_(item.status) !== normalizeProductionOpsStatus_(old.status)
    || Number(item.progress || 0) !== Number(old.progress || 0)
    || String(item.pic || "").trim() !== String(old.pic || "").trim()
    || String(item.note || "").trim() !== String(old.note || "").trim();
}

function getDeptApprovedProgress_(old) {
  old = old || {};
  return Math.max(0, Math.min(100, Math.round(Number(old.progress || 0))));
}

function deriveDeptStatusFromProgress_(progress) {
  progress = Number(progress || 0);
  if (progress >= 100) return "Done";
  if (progress > 0) return "On Progress";
  return "Belum Mulai";
}

function buildDeptApprovalRequest_(projectId, item, ctx, folderCatalog, leadForFolders) {
  var folderUrl = "";
  (folderCatalog || []).forEach(function(folder) {
    if (folder && folder.id === item.id && folder.url) folderUrl = folder.url;
  });
  return {
    projectId: projectId,
    clientName: leadForFolders ? (leadForFolders.clientName || leadForFolders.client || "") : "",
    departmentId: item.id,
    departmentLabel: item.label,
    progress: Number(item.progress || 0),
    pic: item.pic || "",
    notes: item.note || "",
    folderUrl: folderUrl,
    status: "PENDING",
    submittedBy: ctx.email || "",
    submittedAt: new Date().toLocaleString("id-ID")
  };
}

function preserveLockedApprovedDeptItem_(old, item) {
  old = old || {};
  item = item || {};
  return normalizeProductionOpsItem_({
    id: old.id || item.id,
    label: item.label || old.label,
    icon: item.icon || old.icon,
    pic: old.pic || "",
    status: "Done",
    progress: 100,
    note: old.note || "",
    updatedAt: old.updatedAt || "",
    folderUrl: old.folderUrl || item.folderUrl || "",
    approvalStatus: "APPROVED",
    approvalId: old.approvalId || "",
    reviewNotes: old.reviewNotes || "",
    pendingProgress: "",
    pendingStatus: "",
    pendingPic: "",
    pendingNote: "",
    order: old.order || item.order
  }, old, old.order || item.order);
}

function updateProductionOpsProgress(accessKey, projectId, departments, notes, triggerDepartmentId) {
  try {
    var ctx = requireProductionOpsRole_(accessKey);
    projectId = normalizeProjectId_(projectId);
    triggerDepartmentId = String(triggerDepartmentId || "").trim();
    if (!projectId) return { success: false, error: "Project ID wajib diisi." };
    if (isDeptPicRole_(ctx.role)) {
      if (!triggerDepartmentId) {
        return { success: false, error: "PIC harus memilih satu departemen." };
      }
      assertPicDepartmentAccess_(ctx, triggerDepartmentId);
    }

    // Jalur ringan: JANGAN panggil initializeGoogleSheets_ (repair/migrasi berat) tiap simpan.
    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
    if (!leadsSheet) return { success: false, error: "Sheet Leads tidak ditemukan." };
    var data = leadsSheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h || "").trim(); });
    // Migrasi kolom hanya bila memang ada kolom Production Ops yang belum tersedia.
    var lowerHeaders = headers.map(function(h) { return h.toLowerCase(); });
    var requiredOpsCols = [
      "productionstage", "productionupdatedat", "productionupdatedby", "productionnotes",
      "productionopsdata", "productionopsupdatedat", "productionopsupdatedby"
    ];
    var missingOpsCol = requiredOpsCols.some(function(c) { return lowerHeaders.indexOf(c) < 0; });
    if (missingOpsCol) {
      migrateLeadsSheetColumns_(leadsSheet);
      data = leadsSheet.getDataRange().getValues();
      headers = data[0].map(function(h) { return String(h || "").trim(); });
    }
    var headerMap = getHeaderIndexMap_(headers);
    var projectCol = headerMap.id !== undefined ? headerMap.id : 0;
    var stageCol = headers.indexOf("productionStage");
    var updatedAtCol = headers.indexOf("productionUpdatedAt");
    var updatedByCol = headers.indexOf("productionUpdatedBy");
    var notesCol = headers.indexOf("productionNotes");
    var opsDataCol = headers.indexOf("productionOpsData");
    var opsUpdatedAtCol = headers.indexOf("productionOpsUpdatedAt");
    var opsUpdatedByCol = headers.indexOf("productionOpsUpdatedBy");
    var rowIndex = -1;
    var oldStage = "";
    var oldOpsRaw = "";

    for (var i = 1; i < data.length; i++) {
      if (normalizeProjectId_(data[i][projectCol]) === projectId) {
        rowIndex = i;
        oldStage = data[i][stageCol] || "";
        oldOpsRaw = data[i][opsDataCol] || "";
        break;
      }
    }
    if (rowIndex < 0) return { success: false, error: "Project ID tidak ditemukan." };
    if (stageCol < 0 || updatedAtCol < 0 || updatedByCol < 0 || notesCol < 0 || opsDataCol < 0 || opsUpdatedAtCol < 0 || opsUpdatedByCol < 0) {
      return { success: false, error: "Kolom Production Ops belum tersedia. Jalankan initialize sheets terlebih dahulu." };
    }

    var leadForFolders = getLeadByProjectId_(projectId);
    var folderId = extractDriveIdFromUrl_(leadForFolders ? leadForFolders.driveUrl : "");
    // Pakai katalog dari sheet dulu — hindari sync Drive berat setiap simpan update.
    var folderCatalog = getOpsFolderCatalogForProject_(projectId, ss);
    if (!folderCatalog.length && folderId) {
      folderCatalog = syncProjectDriveFolderCatalog_(projectId, folderId);
    }

    var oldItems = normalizeProductionOpsData_(oldOpsRaw, folderCatalog);
    var oldById = {};
    oldItems.forEach(function(item) { oldById[item.id] = item; });

    if (triggerDepartmentId) {
      var triggerOld = oldById[triggerDepartmentId] || {};
      var triggerApproval = String(triggerOld.approvalStatus || "").trim().toUpperCase();
      if (triggerApproval === "APPROVED" && Number(triggerOld.progress || 0) >= 100 && ctx.role !== "DIRECTOR") {
        return {
          success: false,
          error: "Departemen " + (triggerOld.label || triggerDepartmentId) + " sudah tervalidasi 100% dan tidak bisa diubah lagi."
        };
      }
    }

    var normalizedItems = normalizeProductionOpsData_(departments, folderCatalog);
    if (isDeptPicRole_(ctx.role)) {
      var incomingById = {};
      normalizedItems.forEach(function(item) { incomingById[item.id] = item; });
      normalizedItems = oldItems.map(function(old) {
        if (old.id === triggerDepartmentId && incomingById[old.id]) return incomingById[old.id];
        return old;
      });
    }
    var createdApprovals = [];
    var pendingValidation = null;
    var timestamp = new Date().toLocaleString("id-ID");

    if (triggerDepartmentId && requiresDeptDirectorValidation_(ctx)) {
      ensureProductionDeptApprovalsSheet_(ss);
    }

    normalizedItems = normalizedItems.map(function(item) {
      var old = oldById[item.id] || {};
      var isTriggered = triggerDepartmentId === item.id;
      var oldApproval = String(old.approvalStatus || "").trim().toUpperCase();
      // Hanya item yang di-trigger yang butuh cek pending approval; hindari baca sheet untuk semua dept.
      var existingPending = isTriggered ? findPendingDeptApprovalLite_(ss, projectId, item.id) : null;

      if (oldApproval === "APPROVED" && Number(old.progress || 0) >= 100 && ctx.role !== "DIRECTOR") {
        return preserveLockedApprovedDeptItem_(old, item);
      }

      if (ctx.role === "DIRECTOR") {
        if (isTriggered && existingPending) {
          updateDeptApprovalFields_(existingPending.approvalId, {
            status: "CANCELLED",
            reviewedBy: ctx.email || "",
            reviewedAt: timestamp,
            reviewNotes: "Diganti langsung oleh Direktur."
          });
        }
        if (isTriggered) {
          var dProgress = Number(item.progress || 0);
          var dStatus = normalizeProductionOpsStatus_(item.status);
          if (dProgress >= 100) {
            dProgress = 100;
            dStatus = "Done";
          }
          item.progress = dProgress;
          item.status = dStatus;
          item.approvalStatus = dProgress > 0 ? "APPROVED" : "";
          item.reviewNotes = "";
          item.pendingProgress = "";
          item.pendingStatus = "";
          item.pendingPic = "";
          item.pendingNote = "";
          item.updatedAt = timestamp;
        }
        return normalizeProductionOpsItem_(item, old, old.order || item.order);
      }

      if (!isTriggered) {
        return normalizeProductionOpsItem_(Object.assign({}, old, {
          id: item.id,
          label: item.label || old.label,
          icon: item.icon || old.icon,
          folderUrl: item.folderUrl || old.folderUrl
        }), old, old.order || item.order);
      }

      var requestedProgress = Number(item.progress || 0);
      var requestedStatus = normalizeProductionOpsStatus_(item.status);
      var hasChanges = deptItemHasSubmissionChanges_(old, item) || oldApproval === "REJECTED";

      if (!hasChanges) {
        return normalizeProductionOpsItem_(old, old, old.order || item.order);
      }

      var approvalRecord = null;
      if (existingPending && oldApproval === "PENDING") {
        updateDeptApprovalFields_(existingPending.approvalId, {
          progress: requestedProgress,
          pic: item.pic || "",
          notes: item.note || "",
          submittedBy: ctx.email || "",
          submittedAt: timestamp
        });
        approvalRecord = Object.assign({}, existingPending, {
          progress: requestedProgress,
          pic: item.pic || "",
          notes: item.note || ""
        });
      } else {
        if (existingPending) {
          updateDeptApprovalFields_(existingPending.approvalId, {
            status: "CANCELLED",
            reviewedBy: ctx.email || "",
            reviewedAt: timestamp,
            reviewNotes: "Diganti dengan pengajuan progress baru."
          });
        }
        approvalRecord = appendDeptApproval_(buildDeptApprovalRequest_(
          projectId, item, ctx, folderCatalog, leadForFolders
        ));
        createdApprovals.push(approvalRecord);
      }

      pendingValidation = approvalRecord;
      var approvedProgress = getDeptApprovedProgress_(old);

      return normalizeProductionOpsItem_({
        id: item.id,
        label: item.label || old.label,
        icon: item.icon || old.icon,
        pic: old.pic || "",
        note: old.note || "",
        status: "Menunggu Review",
        progress: approvedProgress,
        approvalStatus: "PENDING",
        approvalId: approvalRecord.approvalId,
        reviewNotes: "",
        pendingProgress: requestedProgress,
        pendingStatus: requestedStatus,
        pendingPic: item.pic || "",
        pendingNote: item.note || "",
        updatedAt: timestamp,
        folderUrl: item.folderUrl || old.folderUrl,
        order: item.order || old.order
      }, old, old.order || item.order);
    });

    var summary = getProductionOpsSummary_(normalizedItems);
    var stage = summary.stage;
    var cleanNotes = String(notes || "").trim() || ("Pengajuan progress Production Ops " + summary.overallPercent + "% menunggu validasi Direktur.");

    // Tulis semua kolom dalam SATU round-trip (hindari 7x setValue yang lambat).
    var cellWrites = [
      [stageCol, stage],
      [updatedAtCol, timestamp],
      [updatedByCol, ctx.email || ""],
      [notesCol, sanitizeSheetCell_(cleanNotes)],
      [opsDataCol, stringifyProductionOpsData_(normalizedItems, folderCatalog)],
      [opsUpdatedAtCol, timestamp],
      [opsUpdatedByCol, ctx.email || ""]
    ];
    var minCol = cellWrites[0][0];
    var maxCol = cellWrites[0][0];
    cellWrites.forEach(function(w) {
      if (w[0] < minCol) minCol = w[0];
      if (w[0] > maxCol) maxCol = w[0];
    });
    var rowValues = data[rowIndex].slice(minCol, maxCol + 1);
    cellWrites.forEach(function(w) { rowValues[w[0] - minCol] = w[1]; });
    leadsSheet.getRange(rowIndex + 1, minCol + 1, 1, maxCol - minCol + 1).setValues([rowValues]);

    var histSheet = ss.getSheetByName(CONFIG.SHEET_PROD_HIST);
    if (!histSheet) {
      histSheet = ss.insertSheet(CONFIG.SHEET_PROD_HIST);
      histSheet.appendRow(["timestamp", "projectId", "oldStage", "newStage", "oldProgress", "newProgress", "notes", "updatedBy"]);
    }
    histSheet.appendRow([timestamp, projectId, oldStage, stage, "", "", sanitizeSheetCell_(cleanNotes), ctx.email || ""]);

    var production = buildProductionProgressPayload_(stage, "", timestamp, ctx.email || "", cleanNotes);
    production.overallPercent = summary.overallPercent;

    var notification = { sent: false, reason: "" };
    var driveGate = { unlocked: false, reason: "skipped_on_save" };
    var stageChanged = normalizeProductionStage_(oldStage) !== stage;
    if (stageChanged) {
      var lead = getLeadByProjectId_(projectId);
      notification = sendProductionProgressNotificationToClient_({
        projectId: projectId,
        clientName: lead ? lead.clientName : "",
        clientEmail: lead ? lead.clientEmail : "",
        category: lead ? lead.category : "",
        stage: stage,
        postProgress: "",
        overallPercent: production.overallPercent,
        notes: cleanNotes,
        updatedAt: timestamp
      });
    } else {
      notification.reason = "Stage client tetap sama, email tidak dikirim.";
    }

    // Gate Drive klien hanya dicek saat produksi sudah 100% — hemat waktu di update rutin PIC.
    if (summary.overallPercent >= 100 || stage === "Project Selesai") {
      try {
        driveGate = syncClientDriveGate_(projectId);
      } catch (driveGateErr) {
        Logger.log("syncClientDriveGate_ gagal: " + driveGateErr.message);
        driveGate = { unlocked: false, reason: driveGateErr.message };
      }
    }

    var deptFolders = {};
    folderCatalog.forEach(function(folder) {
      if (folder && folder.id) deptFolders[folder.id] = folder.url || "";
    });

    invalidateAllDataCaches_();
    return {
      success: true,
      projectId: projectId,
      production: production,
      opsData: normalizedItems,
      opsUpdatedAt: timestamp,
      opsUpdatedBy: ctx.email || "",
      notification: notification,
      driveGate: driveGate,
      catalog: folderCatalog,
      deptFolders: deptFolders,
      needsDirectorValidation: !!(pendingValidation || createdApprovals.length),
      pendingDeptApproval: pendingValidation || createdApprovals[0] || null,
      createdDeptApprovals: createdApprovals
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getProjectTimeline(accessKey, projectId) {
  try {
    requireInternalRole_(accessKey);
    initializePaymentSheets_();
    var normalizedProjectId = normalizeProjectId_(projectId);
    if (!normalizedProjectId) {
      return { success: false, error: "Project ID wajib diisi.", timeline: [] };
    }

    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var timeline = [];
    var lead = getLeadByProjectId_(normalizedProjectId);
    if (lead) {
      timeline.push({
        type: "PROJECT_CREATED",
        title: "Project masuk database",
        description: lead.clientName + " · " + (lead.category || "Project baru"),
        timestamp: lead.timestamp || "",
        actor: "System",
        order: 0
      });
    }

    var statusSheet = ensureStatusHistorySheet_(ss);
    if (statusSheet && statusSheet.getLastRow() > 1) {
      var statusRows = statusSheet.getDataRange().getValues();
      var statusMap = getHeaderIndexMap_(statusRows[0]);
      var statusProjectCol = statusMap.projectid !== undefined ? statusMap.projectid : 1;
      var statusOldCol = statusMap.oldstatus !== undefined ? statusMap.oldstatus : 2;
      var statusNewCol = statusMap.newstatus !== undefined ? statusMap.newstatus : 3;
      var statusTimeCol = statusMap.timestamp !== undefined ? statusMap.timestamp : 0;
      var statusNotesCol = statusMap.notes;
      var statusByCol = statusMap.changedby;
      for (var i = 1; i < statusRows.length; i++) {
        if (sameProjectId_(statusRows[i][statusProjectCol], normalizedProjectId)) {
          var oldStatus = statusRows[i][statusOldCol] || "";
          var newStatus = statusRows[i][statusNewCol] || "";
          timeline.push({
            type: "PROJECT_STATUS",
            title: "Status project berubah",
            description: (oldStatus || "-") + " → " + (newStatus || "-"),
            timestamp: formatCellValue_(statusRows[i][statusTimeCol]),
            actor: statusByCol !== undefined ? String(statusRows[i][statusByCol] || "Internal Team") : "Internal Team",
            notes: statusNotesCol !== undefined ? String(statusRows[i][statusNotesCol] || "") : "",
            order: timeline.length + i
          });
        }
      }
    }

    var paymentsMap = getPaymentsMapByProject_();
    var payment = paymentsMap[normalizedProjectId] || {};
    var paymentId = String(payment.paymentId || "");

    var invoiceSheet = ss.getSheetByName(CONFIG.SHEET_PAY_INVOICES);
    if (invoiceSheet && invoiceSheet.getLastRow() > 1) {
      var invoiceRows = invoiceSheet.getDataRange().getValues();
      var invoiceHeaders = invoiceRows[0];
      var invProjectCol = invoiceHeaders.indexOf("projectId");
      var invNumberCol = invoiceHeaders.indexOf("invoiceNumber");
      var invAmountCol = invoiceHeaders.indexOf("amount");
      var invTotalCol = invoiceHeaders.indexOf("totalPaid");
      var invTimeCol = invoiceHeaders.indexOf("timestamp");
      var invByCol = invoiceHeaders.indexOf("validatedBy");
      for (var j = 1; j < invoiceRows.length; j++) {
        if (invProjectCol >= 0 && sameProjectId_(invoiceRows[j][invProjectCol], normalizedProjectId)) {
          var invAmount = Number(invoiceRows[j][invAmountCol] || 0);
          var invTotal = Number(invoiceRows[j][invTotalCol] || 0);
          timeline.push({
            type: "INVOICE",
            title: "Invoice digenerate",
            description: String(invoiceRows[j][invNumberCol] || "Invoice") + " · Rp " + invAmount.toLocaleString("id-ID") + " · Total Rp " + invTotal.toLocaleString("id-ID"),
            timestamp: invTimeCol >= 0 ? formatCellValue_(invoiceRows[j][invTimeCol]) : "",
            actor: invByCol >= 0 ? String(invoiceRows[j][invByCol] || "Internal Team") : "Internal Team",
            order: timeline.length + j
          });
        }
      }
    }

    var paymentHistSheet = ss.getSheetByName(CONFIG.SHEET_PAY_HIST);
    if (paymentHistSheet && paymentHistSheet.getLastRow() > 1 && paymentId) {
      var paymentRows = paymentHistSheet.getDataRange().getValues();
      var paymentHeaders = paymentRows[0];
      var payIdCol = paymentHeaders.indexOf("paymentId");
      var payOldCol = paymentHeaders.indexOf("oldStatus");
      var payNewCol = paymentHeaders.indexOf("newStatus");
      var payTimeCol = paymentHeaders.indexOf("timestamp");
      var payByCol = paymentHeaders.indexOf("changedBy");
      var payNotesCol = paymentHeaders.indexOf("notes");
      for (var k = 1; k < paymentRows.length; k++) {
        if (String(paymentRows[k][payIdCol]).trim() === paymentId) {
          var oldPay = payOldCol >= 0 ? paymentRows[k][payOldCol] : "";
          var newPay = payNewCol >= 0 ? paymentRows[k][payNewCol] : "";
          timeline.push({
            type: "PAYMENT_STATUS",
            title: "Status payment berubah",
            description: (oldPay || "-") + " → " + (newPay || "-"),
            timestamp: payTimeCol >= 0 ? formatCellValue_(paymentRows[k][payTimeCol]) : "",
            actor: payByCol >= 0 ? String(paymentRows[k][payByCol] || "Internal Team") : "Internal Team",
            notes: payNotesCol >= 0 ? String(paymentRows[k][payNotesCol] || "") : "",
            order: timeline.length + k
          });
        }
      }
    }

    var prodHistSheet = ss.getSheetByName(CONFIG.SHEET_PROD_HIST);
    if (prodHistSheet && prodHistSheet.getLastRow() > 1) {
      var prodRows = prodHistSheet.getDataRange().getValues();
      var prodHeaders = prodRows[0];
      var prodProjectCol = prodHeaders.indexOf("projectId");
      var prodStageCol = prodHeaders.indexOf("newStage");
      var prodProgressCol = prodHeaders.indexOf("newProgress");
      var prodTimeCol = prodHeaders.indexOf("timestamp");
      var prodByCol = prodHeaders.indexOf("updatedBy");
      var prodNotesCol = prodHeaders.indexOf("notes");
      for (var p = 1; p < prodRows.length; p++) {
        if (prodProjectCol >= 0 && sameProjectId_(prodRows[p][prodProjectCol], normalizedProjectId)) {
          var prodStage = prodStageCol >= 0 ? String(prodRows[p][prodStageCol] || "") : "";
          var prodProgress = prodProgressCol >= 0 ? String(prodRows[p][prodProgressCol] || "") : "";
          timeline.push({
            type: "PRODUCTION_PROGRESS",
            title: "Progress produksi diperbarui",
            description: prodStage + (prodProgress ? " · " + prodProgress : ""),
            timestamp: prodTimeCol >= 0 ? formatCellValue_(prodRows[p][prodTimeCol]) : "",
            actor: prodByCol >= 0 ? String(prodRows[p][prodByCol] || "Internal Team") : "Internal Team",
            notes: prodNotesCol >= 0 ? String(prodRows[p][prodNotesCol] || "") : "",
            order: timeline.length + p + 20000
          });
        }
      }
    }

    timeline.sort(function(a, b) {
      var ta = parseTimelineTimestamp_(a.timestamp);
      var tb = parseTimelineTimestamp_(b.timestamp);
      if (tb !== ta) return tb - ta;
      return Number(b.order || 0) - Number(a.order || 0);
    });
    return { success: true, projectId: normalizedProjectId, timeline: timeline };
  } catch (err) {
    return { success: false, error: err.message, timeline: [] };
  }
}

function parseTimelineTimestamp_(ts) {
  if (!ts) return 0;
  if (ts instanceof Date) return ts.getTime();
  var s = String(ts).trim();
  var d = new Date(s);
  if (!isNaN(d.getTime())) return d.getTime();
  var m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2})[.:](\d{2})[.:]?(\d{2})?/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]), Number(m[6] || 0)).getTime();
  return 0;
}

// ── INTERNAL: kirim notifikasi intake ────────────────────────
function isValidEmail_(email) {
  var value = String(email || "").trim().toLowerCase();
  return !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeEmailHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Hanya izinkan URL https Drive/Docs/Script untuk atribut href di email. */
function safeEmailHref_(url) {
  var u = String(url || "").trim();
  if (/^https:\/\/(drive|docs)\.google\.com\//i.test(u) || /^https:\/\/script\.google\.com\//i.test(u)) {
    return u.replace(/"/g, "%22").replace(/'/g, "%27");
  }
  return "#";
}

function isValidEmailDriveUrl_(url) {
  return /^https:\/\/(drive|docs)\.google\.com\//i.test(String(url || "").trim());
}

function getEmailBannerStyle_(tone) {
  var tones = {
    purple: "background:linear-gradient(135deg,#9333ea,#7c3aed)",
    green: "background:linear-gradient(135deg,#16a34a,#15803d)",
    red: "background:linear-gradient(135deg,#dc2626,#b91c1c)",
    cyan: "background:linear-gradient(135deg,#28b9d8,#0ea5e9)",
    slate: "background:linear-gradient(135deg,#334155,#1e293b)"
  };
  return tones[tone] || tones.purple;
}

function buildEmailFooterHtml_(variant) {
  variant = variant || "client";
  if (variant === "internal") {
    return [
      "<hr style='border:none;border-top:1px solid #e2e8f0;margin:24px 0'>",
      "<div style='font-size:12px;color:#94a3b8;text-align:center'>",
      "<p><strong>FA Studio Indonesia</strong><br>Operation System</p>",
      "</div>"
    ].join("");
  }
  return [
    "<hr style='border:none;border-top:1px solid #e2e8f0;margin:24px 0'>",
    "<div style='font-size:12px;color:#94a3b8;text-align:center'>",
    "<p><strong>FA Studio Indonesia</strong><br>Yours Unlimited Creativity<br>linktr.ee/askfastudio</p>",
    "</div>"
  ].join("");
}

function buildEmailPortalCtaHtml_(label) {
  label = label || "Buka Client Portal";
  var portalUrl = getClientPortalUrl_();
  if (!portalUrl) {
    return "<p style='font-size:13px;color:#64748b;margin-top:20px;line-height:1.6'>Masuk ke <strong>Client Portal</strong> FA Studio dengan email terdaftar untuk melihat progress, status, dan pembayaran project kamu.</p>";
  }
  return [
    "<div style='text-align:center;margin:24px 0 8px'>",
    "<a href='", safeEmailHref_(portalUrl), "' style='display:inline-block;background:#28b9d8;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:700'>", escapeEmailHtml_(label), "</a>",
    "</div>",
    "<p style='font-size:12px;color:#64748b;text-align:center;margin:0;line-height:1.5'>Sign In dengan email terdaftar — progress, pembayaran, dan akses hasil ada di satu dashboard.</p>"
  ].join("");
}

function buildEmailNotesBlockHtml_(notes, label) {
  notes = String(notes || "").trim();
  if (!notes) return "";
  label = label || "Catatan tim FA";
  return "<p style='margin:18px 0 0;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;color:#334155;line-height:1.6'><strong>" + escapeEmailHtml_(label) + ":</strong><br>" + escapeEmailHtml_(notes) + "</p>";
}

function buildEmailInfoTableHtml_(rows) {
  rows = Array.isArray(rows) ? rows : [];
  var html = ["<table style='width:100%;margin:20px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;border-collapse:collapse'>"];
  rows.forEach(function(row, index) {
    if (!row || !row.label) return;
    var border = index > 0 ? " style='border-top:1px solid #e2e8f0'" : "";
    var valueStyle = row.strong
      ? " style='padding:12px;color:#0f172a;font-weight:700'"
      : " style='padding:12px;color:#0f172a'";
    html.push(
      "<tr" + border + "><td style='padding:12px;font-weight:600;color:#64748b;width:38%'>" + escapeEmailHtml_(row.label) + "</td><td" + valueStyle + ">" + (row.html ? row.value : escapeEmailHtml_(row.value)) + "</td></tr>"
    );
  });
  html.push("</table>");
  return html.join("");
}

function buildClientEmailShellHtml_(bannerTitle, tone, bodyHtml) {
  return [
    "<div style='font-family:Arial,sans-serif;max-width:620px;margin:0 auto'>",
    "<div style='", getEmailBannerStyle_(tone), ";color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center'>",
    "<h2 style='margin:0;font-size:22px'>", escapeEmailHtml_(bannerTitle), "</h2>",
    "</div>",
    "<div style='border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px'>",
    bodyHtml,
    buildEmailFooterHtml_("client"),
    "</div>",
    "</div>"
  ].join("");
}

function buildInternalEmailShellHtml_(bannerTitle, bodyHtml, tone) {
  return [
    "<div style='font-family:Arial,sans-serif;max-width:620px;margin:0 auto'>",
    "<div style='", getEmailBannerStyle_(tone || "slate"), ";color:#fff;padding:22px;border-radius:12px 12px 0 0;text-align:center'>",
    "<h2 style='margin:0;font-size:20px'>", escapeEmailHtml_(bannerTitle), "</h2>",
    "</div>",
    "<div style='border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px'>",
    bodyHtml,
    buildEmailFooterHtml_("internal"),
    "</div>",
    "</div>"
  ].join("");
}

function formatEmailPaymentStatusLabel_(status) {
  status = normalizePaymentStage_(status);
  var labels = {
    "UNPAID": "Belum Bayar",
    "PAYMENT AWAL": "Payment Awal",
    "PAYMENT SETELAH SHOOTING": "Payment Setelah Shooting",
    "LUNAS": "Lunas"
  };
  return labels[status] || status || "-";
}

function getProductionOpsPercentFromLead_(lead) {
  if (!lead) return null;
  try {
    var raw = lead.productionOpsData;
    if (!raw) return null;
    var items = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(items) || !items.length) return null;
    return getProductionOpsSummary_(items).overallPercent;
  } catch (e) {
    return null;
  }
}

function buildProductionSubfolderListHtml_() {
  return getProductionOpsFolderTemplate_().map(function(name) {
    return "<li>" + escapeEmailHtml_(name) + "</li>";
  }).join("");
}

/**
 * Cegah formula/CSV injection saat menulis ke Google Sheets.
 * Prefiks apostrof jika string dimulai dengan = + - @ atau whitespace kontrol.
 */
function sanitizeSheetCell_(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Object.prototype.toString.call(value) === "[object Date]") return value;
  var str = String(value);
  if (!str) return "";
  if (/^[=+\-@\t\r\n]/.test(str) || /^[\t\r\n ]*[=+\-@]/.test(str)) {
    return "'" + str;
  }
  return str;
}

/**
 * Log keamanan append-only. Jangan diedit manual.
 * Kolom: timestamp | actor | action | target | detail | result
 */
function protectAuditLogSheet_(sheet) {
  if (!sheet) return;
  try {
    var existing = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    for (var i = 0; i < existing.length; i++) {
      try { existing[i].remove(); } catch (eRem) {}
    }
    var protection = sheet.protect().setDescription("SecurityAuditLog — jangan edit/hapus baris");
    protection.setWarningOnly(false);
    var me = Session.getEffectiveUser();
    protection.addEditor(me);
    var editors = protection.getEditors();
    for (var e = 0; e < editors.length; e++) {
      if (editors[e].getEmail() !== me.getEmail()) {
        try { protection.removeEditor(editors[e]); } catch (e2) {}
      }
    }
    if (protection.canDomainEdit()) protection.setDomainEdit(false);
  } catch (err) {
    Logger.log("protectAuditLogSheet_ gagal: " + err.message);
  }
}

function ensureAuditLogSheet_(ss) {
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var sheet = ss.getSheetByName(CONFIG.SHEET_AUDIT_LOG);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_AUDIT_LOG);
    sheet.appendRow(["timestamp", "actor", "action", "target", "detail", "result"]);
    sheet.setFrozenRows(1);
    protectAuditLogSheet_(sheet);
  }
  return sheet;
}

function appendAuditLog_(actor, action, target, detail, result) {
  try {
    var sheet = ensureAuditLogSheet_();
    sheet.appendRow([
      new Date().toLocaleString("id-ID"),
      sanitizeSheetCell_(actor || ""),
      sanitizeSheetCell_(action || ""),
      sanitizeSheetCell_(target || ""),
      sanitizeSheetCell_(detail || ""),
      sanitizeSheetCell_(result || "OK")
    ]);
  } catch (e) {
    Logger.log("appendAuditLog_ gagal: " + e.message);
  }
}

/**
 * Cek status config keamanan. Private — jalankan dari dropdown editor Apps Script.
 * Untuk rotasi reCAPTCHA: buat key baru di Google admin, lalu update Script Property
 * RECAPTCHA_SECRET_KEY (dan RECAPTCHA_SITE_KEY jika ikut diganti).
 */
function checkSecurityConfigStatus_() {
  var props = PropertiesService.getScriptProperties();
  return {
    success: true,
    sheetIdSet: !!props.getProperty("SHEET_ID"),
    driveFolderSet: !!props.getProperty("DRIVE_FOLDER_ID"),
    logoFileSet: !!props.getProperty("COMPANY_LOGO_FILE_ID"),
    recaptchaSecretSet: !!props.getProperty("RECAPTCHA_SECRET_KEY"),
    recaptchaSiteSet: !!(props.getProperty("RECAPTCHA_SITE_KEY") || SENSITIVE_IDS_.RECAPTCHA_SITE_KEY),
    sourceHasSheetIdLiteral: !!SENSITIVE_IDS_.SHEET_ID,
    sourceHasRecaptchaSecretLiteral: !!SENSITIVE_IDS_.RECAPTCHA_SECRET_KEY,
    rotateRecaptchaUrl: "https://www.google.com/recaptcha/admin",
    note: "Jika RECAPTCHA_SECRET pernah bocor di source: rotasi di Google admin, lalu update Script Property."
  };
}

/**
 * Batasi editor file Spreadsheet ke owner + Direktur (EMAIL_FROM).
 * Viewer tetap. Kunci juga proteksi sheet SecurityAuditLog.
 * Jalankan sekali dari dropdown editor Apps Script (bukan google.script.run).
 */
function hardenSpreadsheetAccess_() {
  try {
    var sheetId = getConfig_("SHEET_ID");
    if (!sheetId) {
      return { success: false, error: "SHEET_ID belum ada di Script Properties." };
    }
    var file = DriveApp.getFileById(sheetId);
    var allowed = {};
    try {
      var ownerEmail = String(file.getOwner().getEmail() || "").trim().toLowerCase();
      if (ownerEmail) allowed[ownerEmail] = true;
    } catch (eOwn) {}
    var director = String(CONFIG.EMAIL_FROM || "").trim().toLowerCase();
    if (director) allowed[director] = true;
    try {
      var me = String(Session.getEffectiveUser().getEmail() || "").trim().toLowerCase();
      if (me) allowed[me] = true;
    } catch (eMe) {}

    var removed = [];
    var kept = [];
    file.getEditors().forEach(function(user) {
      var email = String(user.getEmail() || "").trim().toLowerCase();
      if (!email) return;
      if (allowed[email]) {
        kept.push(email);
        return;
      }
      try {
        file.removeEditor(user);
        removed.push(email);
      } catch (eRem) {
        removed.push(email + " (gagal: " + eRem.message + ")");
      }
    });

    protectAuditLogSheet_(ensureAuditLogSheet_());
    try {
      appendAuditLog_(
        Session.getEffectiveUser().getEmail(),
        "SHEET_HARDEN_ACCESS",
        sheetId,
        "removed=" + removed.join(",") + ";kept=" + Object.keys(allowed).join(","),
        "OK"
      );
    } catch (eLog) {}

    return {
      success: true,
      message: "Editor Spreadsheet dibatasi ke owner/Direktur. SecurityAuditLog dilindungi keras.",
      allowedEditors: Object.keys(allowed),
      keptEditors: kept,
      removedEditors: removed
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function sendIntakeNotification_(formData, projectId, projectTotal) {
  try {
    var brandName = formData.brandName || formData.clientName || "-";
    var projectType = formData.projectType || formData.serviceType || "-";
    var picName = formData.picName || formData.pic || "-";
    var totalMurid = formData.totalMurid || "";
    var totalValue = parseProjectTotal_(projectTotal || formData.projectTotal || formData.agreedProjectTotal);
    var rows = [
      { label: "Project ID", value: normalizeProjectId_(projectId) },
      { label: "Nama/Brand/Sekolah", value: brandName },
      { label: "WhatsApp", value: formData.whatsapp || "-" },
      { label: "Email", value: formData.email || "-" },
      { label: "Mewakili", value: formData.representativeType || "-" },
      { label: "Tipe Project", value: projectType },
      { label: "Total Harga Kesepakatan", value: formatRupiahId_(totalValue) },
      { label: "PIC", value: picName },
      { label: "Jadwal Shooting", value: formData.shootingDateLabel || "-" },
      { label: "Brief", value: formData.briefNarrative || "-" }
    ];
    if (totalMurid) rows.splice(7, 0, { label: "Total Murid", value: totalMurid });

    MailApp.sendEmail({
      to: CONFIG.EMAIL_FROM,
      name: getMailIdentity_().name,
      replyTo: getMailIdentity_().replyTo,
      subject: "[FA Studio] Project Baru Perlu Dealing — " + normalizeProjectId_(projectId) + " dari " + brandName,
      htmlBody: buildInternalEmailShellHtml_("Project Baru Masuk — Perlu Dealing", [
        "<p>Ada brief baru dari form booking. Buka <strong>FA Operation System → Client Status</strong> untuk follow-up dan dealing.</p>",
        "<p style='font-size:13px;color:#64748b;line-height:1.6'><strong>Catatan flow:</strong> email ke client dikirim otomatis setelah project di-mark sebagai <strong>Deal</strong>.</p>",
        buildEmailInfoTableHtml_(rows)
      ].join(""))
    });
  } catch (e) {
    Logger.log("Email notifikasi gagal: " + e.message);
  }
}

// ── KIRIM EMAIL KE CLIENT KETIKA DEAL (DENGAN FOLDER LINK) ───
function getClientPortalUrl_() {
  try {
    var url = ScriptApp.getService().getUrl();
    return url ? String(url).split("?")[0] : "";
  } catch (e) {
    return "";
  }
}

function formatProductionStageLabel_(stage) {
  return normalizeProductionStage_(stage) || "On Discuss";
}

function sendProductionProgressNotificationToClient_(payload) {
  payload = payload || {};
  var projectId = normalizeProjectId_(payload.projectId);
  var clientEmail = String(payload.clientEmail || "").trim().toLowerCase();
  var clientName = String(payload.clientName || "Client").trim() || "Client";
  var category = String(payload.category || "").trim();
  var stage = normalizeProductionStage_(payload.stage);
  var overallPercent = Number(payload.overallPercent || getProductionOverallPercent_(stage));
  var notes = String(payload.notes || "").trim();
  var updatedAt = String(payload.updatedAt || new Date().toLocaleString("id-ID"));
  var stageLabel = formatProductionStageLabel_(stage);

  if (!clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    return { sent: false, reason: "Email client tidak tersedia." };
  }

  try {
    var rows = [
      { label: "Project ID", value: projectId },
      { label: "Nama Project", value: clientName },
      { label: "Tahap Produksi", value: stageLabel, strong: true },
      { label: "Progress Keseluruhan", value: overallPercent + "%", strong: true },
      { label: "Diperbarui Pada", value: updatedAt }
    ];
    if (category) rows.splice(2, 0, { label: "Kategori", value: category });

    var bodyHtml = [
      "<p>Halo ", escapeEmailHtml_(clientName), ",</p>",
      "<p>Tim FA Studio baru saja memperbarui progress produksi project kamu. Berikut status terbarunya:</p>",
      buildEmailInfoTableHtml_(rows),
      buildEmailNotesBlockHtml_(notes),
      "<p style='font-size:14px;color:#334155;line-height:1.7;margin-top:18px'>Kamu bisa cek detail timeline, status project, dan ringkasan payment langsung di Client Portal.</p>",
      buildEmailPortalCtaHtml_("Lihat Progress di Client Portal")
    ].join("");

    MailApp.sendEmail({
      to: clientEmail,
      name: getMailIdentity_().name,
      replyTo: getMailIdentity_().replyTo,
      subject: "Update Progress Project " + projectId + " · " + stageLabel + " · FA Studio Indonesia",
      htmlBody: buildClientEmailShellHtml_("Progress Project Diperbarui", "purple", bodyHtml)
    });
    return { sent: true, email: clientEmail };
  } catch (e) {
    Logger.log("Email progress produksi gagal: " + e.message);
    return { sent: false, reason: "Gagal mengirim email: " + e.message };
  }
}

function sendProjectStatusNotificationToClient_(payload) {
  payload = payload || {};
  var projectId = normalizeProjectId_(payload.projectId);
  var clientEmail = String(payload.clientEmail || "").trim().toLowerCase();
  var clientName = String(payload.clientName || "Client").trim() || "Client";
  var oldStatus = String(payload.oldStatus || "-").trim() || "-";
  var newStatus = String(payload.newStatus || "").trim();
  var notes = String(payload.notes || "").trim();
  var updatedAt = String(payload.updatedAt || new Date().toLocaleString("id-ID"));

  if (!newStatus) {
    return { sent: false, reason: "Status baru kosong." };
  }
  if (!isValidEmail_(clientEmail)) {
    return { sent: false, reason: "Email client tidak tersedia." };
  }

  try {
    var bodyHtml = [
      "<p>Halo ", escapeEmailHtml_(clientName), ",</p>",
      "<p>Tim FA Studio baru saja memperbarui status project kamu. Berikut detailnya:</p>",
      buildEmailInfoTableHtml_([
        { label: "Project ID", value: projectId },
        { label: "Nama Project", value: clientName },
        { label: "Status Sebelumnya", value: oldStatus },
        { label: "Status Baru", value: newStatus, strong: true },
        { label: "Diperbarui Pada", value: updatedAt }
      ]),
      buildEmailNotesBlockHtml_(notes, "Catatan"),
      "<p style='font-size:14px;color:#334155;line-height:1.7;margin-top:18px'>Kamu bisa cek timeline dan detail project langsung di Client Portal.</p>",
      buildEmailPortalCtaHtml_("Lihat Status di Client Portal")
    ].join("");

    MailApp.sendEmail({
      to: clientEmail,
      name: getMailIdentity_().name,
      replyTo: getMailIdentity_().replyTo,
      subject: "Update Status Project " + projectId + " · " + newStatus + " · FA Studio Indonesia",
      htmlBody: buildClientEmailShellHtml_("Status Project Diperbarui", "purple", bodyHtml)
    });
    return { sent: true, email: clientEmail };
  } catch (e) {
    Logger.log("Email update status gagal: " + e.message);
    return { sent: false, reason: "Gagal mengirim email: " + e.message };
  }
}

function sendDealNotificationToClient_(projectId, clientName, clientEmail, folderUrl) {
  try {
    if (!isValidEmail_(clientEmail)) {
      return { sent: false, reason: "Email client tidak valid: " + clientEmail };
    }
    projectId = normalizeProjectId_(projectId);
    var hasFolder = isValidEmailDriveUrl_(folderUrl);
    var safeFolder = hasFolder ? safeEmailHref_(folderUrl) : "";
    var driveBlock = hasFolder
      ? [
          "<h3 style='color:#1e1e2e;margin-top:24px;font-size:16px'>Folder Project Kamu</h3>",
          "<p>Folder produksi sudah dibuat di Google Drive khusus untuk project ini:</p>",
          "<div style='text-align:center;margin:20px 0'>",
          "<a href='", safeFolder, "' style='display:inline-block;background:#9333ea;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:700'>Buka Folder Project</a>",
          "</div>",
          "<p style='font-size:13px;color:#64748b;margin-top:16px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;line-height:1.55'>",
          "<strong>Penting — akses terbatas:</strong> folder ini hanya bisa dibuka dengan akun Google email booking kamu (<strong>", escapeEmailHtml_(clientEmail), "</strong>).",
          "</p>"
        ].join("")
      : [
          "<h3 style='color:#1e1e2e;margin-top:24px;font-size:16px'>Folder Project</h3>",
          "<p>Folder produksi sedang disiapkan oleh tim FA Studio. Link Google Drive akan dikirim otomatis setelah Production Ops <strong>100% selesai</strong> dan pembayaran project <strong>Lunas</strong>.</p>",
          "<p style='font-size:13px;color:#64748b;margin-top:16px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;line-height:1.55'>",
          "Sementara itu, pantau progress project kamu melalui Client Portal (Sign In dengan email terdaftar).",
          "</p>"
        ].join("");

    var bodyHtml = [
      "<p>Halo ", escapeEmailHtml_(clientName), ",</p>",
      "<p>Terima kasih atas kepercayaan kamu kepada FA Studio Indonesia. Project kamu telah resmi dikonfirmasi dan proses produksi dapat segera dimulai.</p>",
      buildEmailInfoTableHtml_([
        { label: "Project ID", value: projectId },
        { label: "Nama Project", value: clientName }
      ]),
      driveBlock,
      "<p style='font-size:13px;color:#64748b;margin-top:20px;line-height:1.6'>Tim FA Studio akan menghubungi kamu untuk jadwal shooting dan koordinasi lebih lanjut.</p>",
      buildEmailPortalCtaHtml_("Pantau Project di Client Portal")
    ].join("");

    MailApp.sendEmail({
      to: clientEmail,
      name: getMailIdentity_().name,
      replyTo: getMailIdentity_().replyTo,
      subject: "Project Kamu Telah Dikonfirmasi — " + projectId + " · FA Studio Indonesia",
      htmlBody: buildClientEmailShellHtml_("Project Berhasil Dikonfirmasi!", "purple", bodyHtml)
    });
    return { sent: true, email: clientEmail };
  } catch (e) {
    Logger.log("Email ke client gagal: " + e.message);
    return { sent: false, reason: e.message };
  }
}

function sendDriveDeliveryToClient_(projectId, clientName, clientEmail, folderUrl) {
  try {
    if (!isValidEmail_(clientEmail)) {
      return { sent: false, reason: "Email client tidak valid: " + clientEmail };
    }
    if (!isValidEmailDriveUrl_(folderUrl)) {
      return { sent: false, reason: "Folder URL tidak valid." };
    }
    projectId = normalizeProjectId_(projectId);
    var safeFolder = safeEmailHref_(folderUrl);

    var bodyHtml = [
      "<p>Halo ", escapeEmailHtml_(clientName), ",</p>",
      "<p>Folder Google Drive project kamu kini bisa diakses karena syarat berikut sudah terpenuhi:</p>",
      "<ul style='color:#334155;line-height:1.7;padding-left:20px'>",
      "<li>Production Ops <strong>100% selesai</strong></li>",
      "<li>Pembayaran project <strong>Lunas</strong></li>",
      "</ul>",
      buildEmailInfoTableHtml_([
        { label: "Project ID", value: projectId },
        { label: "Nama Project", value: clientName }
      ]),
      "<div style='text-align:center;margin:20px 0'>",
      "<a href='", safeFolder, "' style='display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:700'>Buka Folder Project</a>",
      "</div>",
      "<p style='font-size:13px;color:#64748b;margin-top:16px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;line-height:1.55'>",
      "<strong>Penting — akses terbatas:</strong> folder ini hanya bisa dibuka dengan akun Google email booking kamu (<strong>", escapeEmailHtml_(clientEmail), "</strong>).",
      "</p>",
      buildEmailPortalCtaHtml_("Lihat Ringkasan di Client Portal")
    ].join("");

    MailApp.sendEmail({
      to: clientEmail,
      name: getMailIdentity_().name,
      replyTo: getMailIdentity_().replyTo,
      subject: "Folder Project Siap Diakses — " + projectId + " · FA Studio Indonesia",
      htmlBody: buildClientEmailShellHtml_("Project Siap — Folder Drive Dibuka", "green", bodyHtml)
    });
    return { sent: true, email: clientEmail };
  } catch (e) {
    Logger.log("Email delivery Drive gagal: " + e.message);
    return { sent: false, reason: e.message };
  }
}

// ── KIRIM EMAIL KE INTERNAL KETIKA DEAL ──────────────────────
function sendDealNotificationInternal_(projectId, clientName, folderUrl) {
  try {
    projectId = normalizeProjectId_(projectId);
    var safeFolder = isValidEmailDriveUrl_(folderUrl) ? safeEmailHref_(folderUrl) : "";
    var folderCell = safeFolder
      ? "<a href='" + safeFolder + "'>" + escapeEmailHtml_(folderUrl) + "</a>"
      : "-";

    MailApp.sendEmail({
      to: CONFIG.EMAIL_FROM,
      name: getMailIdentity_().name,
      replyTo: getMailIdentity_().replyTo,
      subject: "[FA Studio] Deal Confirmed — " + projectId + " dari " + clientName,
      htmlBody: buildInternalEmailShellHtml_("Deal Confirmed!", [
        "<p><strong>Project dimulai, folder Drive sudah dibuat.</strong> Email konfirmasi deal sudah dikirim ke client (tanpa link folder — folder dibuka setelah 100% + Lunas).</p>",
        buildEmailInfoTableHtml_([
          { label: "Project ID", value: projectId },
          { label: "Client", value: clientName },
          { label: "Drive Folder", value: folderCell, html: true }
        ]),
        "<p style='margin-top:16px;font-size:13px;color:#64748b'>Subfolder produksi:</p>",
        "<ul style='font-size:13px;color:#64748b;line-height:1.7;padding-left:20px'>",
        buildProductionSubfolderListHtml_(),
        "</ul>"
      ].join(""))
    });
  } catch (e) {
    Logger.log("Email notifikasi internal gagal: " + e.message);
  }
}

// ============================================================
//  PAYMENT VALIDATION & INVOICE MODULE (terpisah dari Leads)
// ============================================================

function initializePaymentSheets_() {
  if (_SHEETS_PAYMENT_READY || isSchemaTaskDone_("paymentSchema")) {
    _SHEETS_PAYMENT_READY = true;
    return;
  }
  var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  try { ensureClientUsersSheet_(ss); } catch (e) {
    Logger.log("ClientUsers saat payment init gagal: " + e.message);
  }
  ensureUsersSheet_(ss);
  ensureDriveAssetsSheet_(ss);

  if (!ss.getSheetByName(CONFIG.SHEET_PAYMENTS)) {
    var paymentsSheet = ss.insertSheet(CONFIG.SHEET_PAYMENTS);
    paymentsSheet.appendRow([
      "paymentId", "projectId", "clientName", "clientEmail",
      "amount", "lastAmount", "projectTotal", "remainingAmount", "paymentMethod", "paymentDate", "proofUrl",
      "bankReference", "notes", "paymentStatus",
      "validatedAt", "validatedBy", "invoiceNumber",
      "invoiceUrl", "invoiceSentAt", "createdAt"
    ]);
  } else {
    migratePaymentSheetColumns_(ss.getSheetByName(CONFIG.SHEET_PAYMENTS));
  }

  if (!ss.getSheetByName(CONFIG.SHEET_PAY_INVOICES)) {
    var invSheet = ss.insertSheet(CONFIG.SHEET_PAY_INVOICES);
    invSheet.appendRow([
      "timestamp", "projectId", "paymentId", "invoiceNumber",
      "amount", "totalPaid", "projectTotal", "remainingAmount", "paymentMethod", "paymentDate",
      "bankReference", "invoiceUrl", "proofUrl", "validatedBy", "notes"
    ]);
  } else {
    migratePaymentInvoiceSheetColumns_(ss.getSheetByName(CONFIG.SHEET_PAY_INVOICES));
  }

  if (!ss.getSheetByName(CONFIG.SHEET_PAY_HIST)) {
    var histSheet = ss.insertSheet(CONFIG.SHEET_PAY_HIST);
    histSheet.appendRow(["timestamp", "paymentId", "oldStatus", "newStatus", "changedBy", "notes"]);
  }

  ensurePaymentApprovalsSheet_(ss);
  ensureProductionDeptApprovalsSheet_(ss);

  _SHEETS_PAYMENT_READY = true;
  markSchemaTaskDone_("paymentSchema");
}

function initializePaymentSheets(accessKey) {
  try {
    requireInternalRole_(accessKey);
    initializePaymentSheets_();
    return { success: true, message: "Payment sheets sudah siap" };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function normalizeDeptPicRole_(role) {
  role = String(role || "").trim().toUpperCase()
    .replace(/[\/\-]+/g, "_")
    .replace(/\s+/g, "_");
  if (role === "MARKETING") return "MARKETING";
  if (role === "SOUND_MAN" || role === "SOUNDMAN" || role === "SOUND") return "SOUND_MAN";
  if (
    role === "FINAL_VIDEO"
    || role === "FINALVIDEO"
    || role === "EDITOR"
    || role === "FINAL_VIDEO_EDITOR"
    || role === "FINAL_VIDEOEDITOR"
  ) return "EDITOR";
  return "";
}

function isDeptPicRole_(role) {
  return !!normalizeDeptPicRole_(role);
}

function isClientRole_(role) {
  return String(role || "").trim().toUpperCase() === "CLIENT";
}

function isAllowedInternalLoginRole_(role) {
  role = String(role || "").trim().toUpperCase();
  return role === "INTERNAL" || role === "OFFICER" || role === "DIRECTOR" || role === "DIREKTUR" || isDeptPicRole_(role);
}

function isOpsOfficeRole_(role) {
  role = String(role || "").trim().toUpperCase();
  return role === "DIRECTOR" || role === "DIREKTUR" || role === "OFFICER" || role === "INTERNAL";
}

function mapInternalAccessRole_(role) {
  role = String(role || "").trim().toUpperCase();
  if (role === "DIRECTOR" || role === "DIREKTUR") return "DIRECTOR";
  var deptRole = normalizeDeptPicRole_(role);
  if (deptRole) return deptRole;
  if (role === "INTERNAL" || role === "OFFICER") return "OFFICER";
  return "";
}

function mapLoginRole_(role) {
  if (isClientRole_(role)) return "CLIENT";
  return mapInternalAccessRole_(role);
}

function getHomeViewForRole_(role) {
  if (isClientRole_(role)) return "client-portal";
  if (isDeptPicRole_(role)) return "production-ops";
  return "analytics";
}

function getUserProjectId_(user) {
  if (!user) return "";
  return normalizeProjectId_(user.projectId || "");
}

function normalizeSavedUserRole_(role) {
  role = String(role || "").trim().toUpperCase();
  if (role === "DIRECTOR" || role === "DIREKTUR") return "DIRECTOR";
  if (role === "CLIENT") return "CLIENT";
  if (role === "INTERNAL" || role === "OFFICER") return "OFFICER";
  return normalizeDeptPicRole_(role) || "";
}

function resolveClientProjectId_(projectId) {
  try { initializeGoogleSheets_(); } catch (e) {}
  projectId = normalizeProjectId_(projectId);
  if (!projectId) return "";
  var lead = getLeadByProjectId_(projectId);
  if (!lead) return "";
  return normalizeProjectId_(lead.projectId || projectId);
}

function getDeptPicRoleLabel_(role) {
  var normalized = normalizeDeptPicRole_(role) || String(role || "").trim().toUpperCase();
  if (normalized === "MARKETING") return "Marketing";
  if (normalized === "SOUND_MAN") return "Sound Man";
  if (normalized === "EDITOR") return "Editor";
  return normalized || "PIC Departemen";
}

/** Folder Drive / departmentId yang boleh diubah PIC sesuai role-nya. */
function getDeptPicAllowedDepartmentIds_(role) {
  var normalized = normalizeDeptPicRole_(role);
  if (normalized === "MARKETING") return ["marketing"];
  if (normalized === "SOUND_MAN") return ["sound-man"];
  if (normalized === "EDITOR") return ["final-video"];
  return [];
}

function assertPicDepartmentAccess_(ctx, departmentId) {
  if (!ctx || !isDeptPicRole_(ctx.role)) return;
  var allowed = getDeptPicAllowedDepartmentIds_(ctx.role);
  var id = String(departmentId || "").trim();
  if (!id || allowed.indexOf(id) < 0) {
    throw new Error("PIC hanya boleh mengubah departemen " + getDeptPicRoleLabel_(ctx.role) + ".");
  }
}

function upsertDeptPicUser_(email, name, password, role, forcePassword) {
  email = String(email || "").trim().toLowerCase();
  name = String(name || "").trim();
  password = String(password || "");
  role = normalizeDeptPicRole_(role);
  forcePassword = forcePassword === true;
  if (!email || !role) {
    return { success: false, error: "Data akun PIC tidak lengkap." };
  }

  var sheet = ensureUsersSheet_();
  var existingAccount = findUserByEmail_(email);
  if (existingAccount && (isClientRole_(existingAccount.role) || existingAccount.sheetName === CONFIG.SHEET_CLIENT_USERS)) {
    return { success: false, error: "Email ini sudah terdaftar sebagai client." };
  }

  migrateUsersSheetColumns_(sheet);
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var emailCol = headers.indexOf("email");
  var nameCol = headers.indexOf("name");
  var roleCol = headers.indexOf("role");
  var passwordCol = headers.indexOf("password");
  var activeCol = headers.indexOf("isactive");
  var createdCol = headers.indexOf("createdat");
  if (emailCol < 0) emailCol = 0;
  if (nameCol < 0) nameCol = 1;
  if (roleCol < 0) roleCol = 2;
  if (passwordCol < 0) passwordCol = 3;
  if (activeCol < 0) activeCol = 4;

  var rowIndex = -1;
  var existingPassword = "";
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][emailCol] || "").trim().toLowerCase() === email) {
      rowIndex = i + 1;
      existingPassword = String(data[i][passwordCol] || "");
      break;
    }
  }

  if (rowIndex < 0) {
    if (!password) return { success: false, error: "Password wajib diisi untuk user baru." };
    var newPolicy = validatePasswordPolicy_(password);
    if (!newPolicy.ok) return { success: false, error: newPolicy.error };
    sheet.appendRow([
      email,
      sanitizeSheetCell_(name || getDeptPicRoleLabel_(role)),
      role,
      hashPassword_(password),
      "TRUE",
      new Date().toLocaleString("id-ID")
    ]);
  } else {
    sheet.getRange(rowIndex, nameCol + 1).setValue(sanitizeSheetCell_(name || getDeptPicRoleLabel_(role)));
    sheet.getRange(rowIndex, roleCol + 1).setValue(role);
    sheet.getRange(rowIndex, activeCol + 1).setValue("TRUE");
    if (forcePassword || !existingPassword) {
      if (!password) return { success: false, error: "Password wajib diisi." };
      var forcePolicy = validatePasswordPolicy_(password);
      if (!forcePolicy.ok) return { success: false, error: forcePolicy.error };
      sheet.getRange(rowIndex, passwordCol + 1).setValue(hashPassword_(password));
      revokeAllInternalSessions_(email);
    }
    if (createdCol >= 0 && !String(data[rowIndex - 1][createdCol] || "").trim()) {
      sheet.getRange(rowIndex, createdCol + 1).setValue(new Date().toLocaleString("id-ID"));
    }
  }
  invalidateUserCache_(email);
  return { success: true, email: email, role: role, name: name || getDeptPicRoleLabel_(role) };
}

/** Daftar akun PIC seed historis — dipakai seed, bukan password. */
var DEPT_PIC_SEED_SPECS_ = [
  { email: "tegar.ananda.ta@gmail.com", name: "Tegar Ananda", role: "MARKETING" },
  { email: "darrellahmad2196@gmail.com", name: "Darrell Ahmad", role: "SOUND_MAN" },
  { email: "ajairiders12@gmail.com", name: "Ajai", role: "EDITOR" }
];

/**
 * Password seed PIC hanya dari Script Properties (bukan source).
 * Key: SEED_PIC_PASSWORD_MARKETING | SEED_PIC_PASSWORD_SOUND_MAN | SEED_PIC_PASSWORD_EDITOR
 */
function getDeptPicSeedPassword_(role) {
  var key = "SEED_PIC_PASSWORD_" + String(role || "").trim().toUpperCase();
  try {
    return String(PropertiesService.getScriptProperties().getProperty(key) || "");
  } catch (e) {
    return "";
  }
}

function clearDeptPicSeedPasswords_() {
  try {
    var props = PropertiesService.getScriptProperties();
    ["MARKETING", "SOUND_MAN", "EDITOR"].forEach(function(role) {
      try { props.deleteProperty("SEED_PIC_PASSWORD_" + role); } catch (e) {}
    });
  } catch (e) {}
}

/**
 * Seed / perbaiki akun PIC departemen. Private — hanya dari editor Apps Script
 * atau pemanggilan internal. Password tidak pernah ditulis di source code.
 * @param {boolean=} forcePassword true = overwrite password dari Script Properties
 */
function seedProductionDeptUsers_(forcePassword) {
  try {
    initializePaymentSheets_();
    forcePassword = forcePassword === true;
    var seeded = [];
    for (var i = 0; i < DEPT_PIC_SEED_SPECS_.length; i++) {
      var spec = DEPT_PIC_SEED_SPECS_[i];
      var pwd = getDeptPicSeedPassword_(spec.role);
      var existing = findUserByEmail_(spec.email);
      if (!existing && !pwd) {
        seeded.push({
          success: false,
          email: spec.email,
          role: spec.role,
          error: "User baru butuh Script Property SEED_PIC_PASSWORD_" + spec.role + "."
        });
        continue;
      }
      var shouldForce = forcePassword && !!pwd;
      if (existing && !shouldForce && !String(existing.password || "").trim() && !pwd) {
        seeded.push({
          success: false,
          email: spec.email,
          role: spec.role,
          error: "Password kosong. Set Script Property SEED_PIC_PASSWORD_" + spec.role + "."
        });
        continue;
      }
      seeded.push(upsertDeptPicUser_(spec.email, spec.name, pwd, spec.role, shouldForce || (!existing && !!pwd)));
    }
    return {
      success: true,
      message: "Akun PIC departemen diproses (password hanya dari Script Properties).",
      users: seeded
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function isSeededDeptPicReady_(email, expectedRole) {
  var user = findUserByEmail_(email);
  if (!user) return false;
  var isActive = user.isActive === true || String(user.isActive).trim().toUpperCase() === "TRUE";
  var rawRole = String(user.role || "").trim().toUpperCase();
  var role = normalizeDeptPicRole_(user.role);
  var password = String(user.password || "").trim();
  return isActive && role === expectedRole && rawRole === expectedRole && !!password;
}

/** Auto-seed dimatikan — PIC hanya dibuat manual / via seedProductionDeptUsers_ dari editor. */
function ensureProductionDeptUsers_() {
  return;
}

function validateInternalLogin(email, password, recaptchaToken) {
  try {
    var _tStart = Date.now();
    var _tMark = _tStart;
    var _timings = {};
    function _lap(label) {
      var now = Date.now();
      _timings[label] = now - _tMark;
      _tMark = now;
    }
    var normalizedEmail = String(email || "").trim().toLowerCase();
    var plainPassword = String(password || "");
    if (!normalizedEmail) {
      return { success: false, error: "Email wajib diisi." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, error: "Format email tidak valid." };
    }
    if (!plainPassword) {
      return { success: false, error: "Password wajib diisi." };
    }
    var captcha = verifyRecaptchaToken_(recaptchaToken);
    if (!captcha.ok) return { success: false, error: captcha.error };
    _lap("recaptcha");
    if (!checkRateLimit_("internal_login_" + Utilities.base64EncodeWebSafe(normalizedEmail), 10, 900, normalizedEmail)) {
      return { success: false, error: "Terlalu banyak percobaan login. Coba lagi beberapa menit lagi." };
    }
    _lap("rateLimit");

    var user = findUserByEmail_(normalizedEmail);
    _lap("findUser");
    if (!user) {
      return { success: false, error: "Email atau password tidak valid." };
    }
    var role = String(user.role || "").trim().toUpperCase();
    var storedPassword = String(user.password || "");
    var mappedRole = mapLoginRole_(role);
    var isActive = isUserActiveFlag_(user.isActive);
    if (!storedPassword) {
      return { success: false, error: "Password akun belum diatur. Hubungi FA Studio untuk bantuan." };
    }
    // Hash tanpa salt (sha256:) sudah tidak didukung — wajib reset.
    if (isLegacyUnsaltedPasswordHash_(storedPassword)) {
      return {
        success: false,
        error: "Password akun memakai format lama yang sudah tidak didukung. Gunakan Lupa Password untuk reset."
      };
    }
    if (!hasRecognizedPasswordHash_(storedPassword)) {
      return { success: false, error: "Format password akun tidak valid. Reset password atau hubungi FA Studio." };
    }
    if (!isActive) {
      return { success: false, error: "Akun tidak aktif. Hubungi FA Studio untuk bantuan." };
    }
    if (!mappedRole) {
      return { success: false, error: "Role akun tidak dikenali (" + (role || "kosong") + "). Hubungi FA Studio." };
    }
    var passwordOk = isPasswordMatchCached_(normalizedEmail, plainPassword, storedPassword);
    _lap("passwordVerify");
    _timings.passwordFromCache = _PASSWORD_VERIFY_FROM_CACHE_;
    if (passwordOk) {
      migratePasswordHashIfNeeded_(user, plainPassword, storedPassword);
      _lap("passwordMigrate");
      var loginRes = {
        success: true,
        role: mappedRole,
        email: normalizedEmail,
        name: user.name || "",
        sessionToken: createInternalSession_(normalizedEmail),
        homeView: getHomeViewForRole_(mappedRole),
        projectId: getUserProjectId_(user) || ""
      };
      _lap("createSession");
      // Client Portal: kirim data dashboard sekalian supaya begitu masuk halaman
      // datanya sudah tersaji, tanpa fetch kedua yang bikin loading di dalam page.
      // Hanya kirim kalau cache portal masih hangat. Kalau dingin, jangan bangun
      // di sini: scan sheet penuh akan menahan tombol Sign In. Client akan tampil
      // dari snapshot lokal lalu menyegarkan sendiri di belakang layar.
      if (isClientRole_(mappedRole)) {
        try {
          var cachedPortal = buildClientPortalPayloadForCtx_({
            role: mappedRole,
            email: normalizedEmail,
            name: user.name || "",
            projectId: getUserProjectId_(user)
          }, { cacheOnly: true });
          if (cachedPortal) loginRes.portal = cachedPortal;
          _timings.portalFromCache = !!cachedPortal;
        } catch (portalErr) {}
        _lap("buildPortal");
      }
      // Bonus: kalau cache dashboard masih hangat, kirim sekalian supaya
      // data langsung tampil tanpa round-trip kedua. Kalau belum ada cache,
      // biarkan client fetch sendiri agar login tetap cepat.
      if (!isClientRole_(mappedRole) && !isDeptPicRole_(mappedRole) && mapInternalAccessRole_(mappedRole)) {
        try {
          var warm = buildOperationDataFromCache_({
            role: mappedRole,
            email: normalizedEmail,
            name: user.name || "",
            projectId: getUserProjectId_(user)
          });
          if (warm) loginRes.opsData = stripInternalFields_(warm);
          _timings.opsDataFromCache = !!warm;
        } catch (warmErr) {}
        _lap("buildOpsData");
      }
      _timings.total = Date.now() - _tStart;
      loginRes._timings = _timings;
      Logger.log("validateInternalLogin timings: " + JSON.stringify(_timings));
      return loginRes;
    }

    return { success: false, error: "Email atau password tidak valid." };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Payload dashboard Client Portal, dengan CacheService supaya login berikutnya instan.
function buildClientPortalPayloadForCtx_(ctx, options) {
  options = options || {};
  var cacheKey = getClientPortalCacheKey_(ctx.email);
  if (options.useCache !== false) {
    var cached = getCacheLarge_(cacheKey);
    // Jangan pakai cache kosong — bisa "mengunci" dashboard tanpa project
    // padahal data lead sudah ada (email mismatch sementara / race).
    if (cached && cached.success && Array.isArray(cached.projects) && cached.projects.length) {
      cached.fromCache = true;
      return cached;
    }
  }
  // Pemanggil yang tidak boleh menunggu scan sheet penuh.
  if (options.cacheOnly) return null;
  var projects = [];
  try {
    projects = listClientPortalProjectsByEmail_(ctx.email);
  } catch (listErr) {
    Logger.log("listClientPortalProjectsByEmail_ gagal: " + listErr.message);
  }
  var payload = {
    success: true,
    projects: projects,
    project: projects.length ? projects[0] : null,
    email: ctx.email,
    name: ctx.name,
    role: ctx.role,
    projectId: (projects[0] && projects[0].projectId) || ctx.projectId || "",
    homeView: "client-portal"
  };
  // Hanya cache kalau ada project — empty state selalu dihitung ulang.
  if (projects.length) {
    putCache_(cacheKey, payload);
    rememberClientPortalCacheKey_(ctx.email);
  } else {
    try { invalidateCache_(cacheKey); } catch (e) {}
  }
  return payload;
}

function getClientPortalForSession(accessKey) {
  try {
    var ctx = requireLoginRole_(accessKey);
    if (!isClientRole_(ctx.role)) {
      return { success: false, error: "Akun ini bukan akun Client Portal." };
    }
    return buildClientPortalPayloadForCtx_(ctx);
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function refreshClientPortalForSession(accessKey) {
  try {
    var ctx = requireLoginRole_(accessKey);
    if (!isClientRole_(ctx.role)) {
      return { success: false, error: "Akun ini bukan akun Client Portal." };
    }
    return buildClientPortalPayloadForCtx_(ctx, { useCache: false });
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function normalizeClientNameKey_(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f]/gi, "");
}

function collectProjectIdsByClientEmailFromSheet_(sheet, email, addId) {
  if (!sheet || sheet.getLastRow() < 2 || typeof addId !== "function") return;
  collectProjectIdsFromValues_(sheet.getDataRange().getValues(), email, addId);
}

function collectProjectIdsFromValues_(data, email, addId) {
  if (!data || data.length < 2 || typeof addId !== "function") return;
  var map = getHeaderIndexMap_(data[0]);
  var emailCol = map.clientemail !== undefined ? map.clientemail : map.email;
  var pidCol = map.projectid !== undefined ? map.projectid : map.id;
  if (emailCol === undefined || pidCol === undefined) return;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][emailCol] || "").trim().toLowerCase() === email) {
      addId(data[i][pidCol]);
    }
  }
}

function listClientPortalProjectsByEmail_(email) {
  email = String(email || "").trim().toLowerCase();
  if (!email) return [];
  var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var ids = [];
  var seen = {};
  var leadById = {};

  function addId(raw) {
    var pid = normalizeProjectId_(raw);
    if (!pid || seen[pid]) return;
    seen[pid] = true;
    ids.push(pid);
  }

  var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
  // Sheet DriveAssets hanya dibaca kalau ada baris lead yang benar-benar butuh fallback.
  var driveByProject = null;
  function driveUrlFallback_(pid) {
    if (!driveByProject) driveByProject = getProjectDriveUrlMap_(ss);
    return driveByProject[pid];
  }
  var accountUser = findUserByEmail_(email);
  var accountNameKey = accountUser ? normalizeClientNameKey_(accountUser.name) : "";

  if (leadsSheet && leadsSheet.getLastRow() > 1) {
    var data = leadsSheet.getDataRange().getValues();
    var headers = data[0];
    var headerMap = getHeaderIndexMap_(headers);
    var idIdx = headerMap.id !== undefined ? headerMap.id : 0;
    for (var i = 1; i < data.length; i++) {
      var pid = normalizeProjectId_(data[i][idIdx]);
      if (!pid) continue;
      var clientEmail = String(resolveClientEmail_(pid, data[i], headers) || "").trim().toLowerCase();
      var clientName = String(getRowValueByHeader_(data[i], headerMap, ["client", "brandname"], data[i][1]) || "").trim();
      var matchedByEmail = clientEmail && clientEmail === email;
      var matchedByName = !matchedByEmail
        && accountNameKey
        && accountNameKey.length >= 6
        && normalizeClientNameKey_(clientName) === accountNameKey
        && (!clientEmail || clientEmail === email);
      if (!matchedByEmail && !matchedByName) continue;
      addId(pid);
      var driveUrl = getRowValueByHeader_(data[i], headerMap, ["driveurl"], data[i][4]);
      if (!String(driveUrl || "").trim()) {
        driveUrl = driveUrlFallback_(pid) || findDriveUrlInLeadRow_(data[i], headerMap);
      }
      leadById[pid] = {
        projectId: data[i][idIdx],
        clientName: clientName,
        category: getRowValueByHeader_(data[i], headerMap, ["category", "projecttype"], data[i][2]),
        status: getRowValueByHeader_(data[i], headerMap, ["status"], data[i][3]),
        driveUrl: driveUrl,
        timestamp: formatCellValue_(getRowValueByHeader_(data[i], headerMap, ["timestamp"], data[i][5])),
        pic: getRowValueByHeader_(data[i], headerMap, ["pic"], data[i][6]),
        notes: getRowValueByHeader_(data[i], headerMap, ["notes"], data[i][7]),
        clientEmail: clientEmail || email,
        productionStage: getCellByHeader_(data[i], headers, "productionStage"),
        postProductionProgress: getCellByHeader_(data[i], headers, "postProductionProgress"),
        productionUpdatedAt: getCellByHeader_(data[i], headers, "productionUpdatedAt"),
        productionUpdatedBy: getCellByHeader_(data[i], headers, "productionUpdatedBy"),
        productionNotes: getCellByHeader_(data[i], headers, "productionNotes"),
        productionOpsData: getCellByHeader_(data[i], headers, "productionOpsData"),
        productionOpsUpdatedAt: getCellByHeader_(data[i], headers, "productionOpsUpdatedAt"),
        productionOpsUpdatedBy: getCellByHeader_(data[i], headers, "productionOpsUpdatedBy"),
        projectTotal: parseProjectTotal_(getCellByHeader_(data[i], headers, "projectTotal")),
        totalMurid: getCellByHeader_(data[i], headers, "totalMurid"),
        shootingDays: getCellByHeader_(data[i], headers, "shootingDays"),
        shootingStartDate: toShootingIsoDate_(getCellByHeader_(data[i], headers, "shootingStartDate")),
        shootingEndDate: toShootingIsoDate_(getCellByHeader_(data[i], headers, "shootingEndDate")),
        shootingDateLabel: getCellByHeader_(data[i], headers, "shootingDateLabel"),
        shootingReleasedAt: getCellByHeader_(data[i], headers, "shootingReleasedAt")
      };
    }
  }

  var intake = ss.getSheetByName(CONFIG.SHEET_CLIENTS);
  if (intake && intake.getLastRow() > 1) {
    var idata = intake.getDataRange().getValues();
    var imap = getHeaderIndexMap_(idata[0]);
    var emailCol = imap.email;
    var pidCol = imap.projectid;
    if (emailCol !== undefined && pidCol !== undefined) {
      for (var j = 1; j < idata.length; j++) {
        if (String(idata[j][emailCol] || "").trim().toLowerCase() === email) {
          addId(idata[j][pidCol]);
        }
      }
    }
  }

  // Payments / Invoices sering punya clientEmail meski kolom email di Leads kosong/beda.
  // Nilainya dibaca sekali lalu dipakai ulang untuk membangun peta pembayaran.
  var paymentsSheet = ss.getSheetByName(CONFIG.SHEET_PAYMENTS);
  var paymentsValues = paymentsSheet && paymentsSheet.getLastRow() > 1
    ? paymentsSheet.getDataRange().getValues() : null;
  var invoicesSheet = ss.getSheetByName(CONFIG.SHEET_PAY_INVOICES);
  var invoicesValues = invoicesSheet && invoicesSheet.getLastRow() > 1
    ? invoicesSheet.getDataRange().getValues() : null;
  collectProjectIdsFromValues_(paymentsValues, email, addId);
  collectProjectIdsFromValues_(invoicesValues, email, addId);

  if (!ids.length) return [];

  // Shared payment maps once — jangan baca ulang per project.
  var shared = {
    rawPayments: getPaymentsMapByProject_(paymentsValues),
    invoiceAgg: getInvoiceAggMap_(invoicesValues)
  };
  shared.paymentMap = serializePaymentMap_(shared.rawPayments, null, shared.invoiceAgg);

  var projects = [];
  for (var k = 0; k < ids.length; k++) {
    var lead = leadById[ids[k]] || getLeadByProjectId_(ids[k]);
    if (!lead) continue;
    var result = buildClientPortalProjectPayload_(lead, shared);
    if (result && result.success && result.project) projects.push(result.project);
  }
  return projects;
}

function signUpClientAccount(name, email, password, pdpConsent) {
  try {
    name = String(name || "").trim();
    email = String(email || "").trim().toLowerCase();
    password = String(password || "");
    if (!name) return { success: false, error: "Nama wajib diisi." };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Email tidak valid." };
    }
    var policy = validatePasswordPolicy_(password);
    if (!policy.ok) return { success: false, error: policy.error };
    if (!isTruthyConsent_(pdpConsent)) {
      return { success: false, error: "Persetujuan Syarat & Ketentuan serta Kebijakan Privasi wajib dicentang." };
    }
    if (!isSignupEmailVerified_(email)) {
      return { success: false, error: "Email belum diverifikasi OTP. Kirim dan verifikasi kode terlebih dahulu." };
    }
    if (!checkRateLimit_("client_signup_" + Utilities.base64EncodeWebSafe(email), 6, 900, email)) {
      return { success: false, error: "Terlalu banyak percobaan Sign Up. Coba lagi beberapa menit lagi." };
    }

    ensureClientUsersSheet_();
    var existing = findUserByEmail_(email);
    if (existing) {
      var existingRole = mapLoginRole_(existing.role);
      if (isClientRole_(existingRole)) {
        return { success: false, error: "Akun sudah terdaftar. Silakan Sign In." };
      }
      return { success: false, error: "Email ini sudah terdaftar. Silakan Sign In." };
    }

    var nowLabel = new Date().toLocaleString("id-ID");
    var clientSheet = ensureClientUsersSheet_();
    appendRowByHeader_(clientSheet, {
      email: email,
      name: sanitizeSheetCell_(name),
      password: hashPassword_(password),
      isActive: "TRUE",
      createdAt: nowLabel,
      pdpConsent: "TRUE",
      pdpConsentAt: nowLabel,
      pdpPolicyVersion: getPdpPolicyVersion_(pdpConsent)
    });
    invalidateUserCache_(email);
    CacheService.getScriptCache().remove(getSignupEmailVerifiedCacheKey_(email));

    return {
      success: true,
      role: "CLIENT",
      email: email,
      name: name,
      sessionToken: createInternalSession_(email),
      homeView: "client-portal",
      projectId: ""
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function listInternalUsers(accessKey) {
  try {
    requireInternalRole_(accessKey);
    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var usersSheet = ss.getSheetByName(CONFIG.SHEET_USERS);
    var clientSheet = ss.getSheetByName(CONFIG.SHEET_CLIENT_USERS);
    var users = listMappedUsersFromSheet_(usersSheet, "")
      .concat(clientSheet ? listMappedUsersFromSheet_(clientSheet, "CLIENT") : []);
    return { success: true, users: users };
  } catch (err) {
    return { success: false, error: err.message, users: [] };
  }
}

function listMappedUsersFromSheet_(sheet, defaultRole) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var emailCol = headers.indexOf("email");
  var nameCol = headers.indexOf("name");
  var roleCol = headers.indexOf("role");
  var activeCol = headers.indexOf("isactive");
  var createdCol = headers.indexOf("createdat");
  if (emailCol < 0) emailCol = 0;
  if (nameCol < 0) nameCol = 1;
  if (activeCol < 0) activeCol = roleCol >= 0 ? 4 : 3;

  return data.slice(1).map(function(row) {
    var email = String(row[emailCol] || "").trim().toLowerCase();
    var isActive = row[activeCol] === true || String(row[activeCol] || "").trim().toUpperCase() === "TRUE";
    var role = defaultRole || mapLoginRole_(row[roleCol]) || String(row[roleCol] || "").trim().toUpperCase();
    return {
      email: email,
      name: String(row[nameCol] || "").trim(),
      role: role,
      projectId: "",
      isActive: isActive,
      createdAt: createdCol >= 0 ? formatCellValue_(row[createdCol]) : "",
      accountSheet: sheet.getName()
    };
  }).filter(function(user) { return !!user.email; });
}

function saveInternalUser(accessKey, userData) {
  var ctx = requireDirectorRole_(accessKey);
  try {
    userData = userData || {};
    var email = String(userData.email || "").trim().toLowerCase();
    var name = String(userData.name || "").trim();
    var password = String(userData.password || "");
    var isActive = userData.isActive === true || String(userData.isActive || "").trim().toUpperCase() === "TRUE";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Email user tidak valid." };
    }
    if (!name) return { success: false, error: "Nama user wajib diisi." };

    ensureUsersSheet_();
    var existing = findUserByEmail_(email);
    var existingRole = existing ? mapLoginRole_(existing.role) : "";
    var role = normalizeSavedUserRole_(userData.role) || existingRole || "OFFICER";
    if (!role) return { success: false, error: "Role user tidak valid." };
    if (email === String(CONFIG.EMAIL_FROM || "").trim().toLowerCase() && isClientRole_(role)) {
      return { success: false, error: "Akun Direktur utama tidak bisa diubah menjadi Client." };
    }
    if (!existing && !password) {
      return { success: false, error: "Password wajib diisi untuk user baru." };
    }
    if (password) {
      var policy = validatePasswordPolicy_(password);
      if (!policy.ok) return { success: false, error: policy.error };
    }

    var passwordHash = password ? hashPassword_(password) : (existing ? existing.password : "");
    var createdAt = new Date().toLocaleString("id-ID");
    var targetIsClient = isClientRole_(role);
    var sourceIsClient = !!(existing && existing.sheetName === CONFIG.SHEET_CLIENT_USERS);
    var roleChanged = !!(existing && existingRole && existingRole !== role);

    if (targetIsClient) {
      upsertClientUserRow_(email, name, passwordHash, isActive, createdAt, sourceIsClient ? existing : null);
      if (existing && !sourceIsClient) {
        deleteUserRowByEmail_(ensureUsersSheet_(), email);
      }
    } else {
      upsertStaffUserRow_(email, name, role, passwordHash, isActive, createdAt, !sourceIsClient ? existing : null);
      if (existing && sourceIsClient) {
        deleteUserRowByEmail_(ensureClientUsersSheet_(), email);
      }
    }

    invalidateUserCache_(email);
    // Password baru, nonaktif, atau ganti role → cabut sesi lama (mis. mantan Direktur).
    if (password || !isActive || roleChanged) revokeAllInternalSessions_(email);
    appendAuditLog_(
      ctx.email,
      existing ? "USER_UPDATE" : "USER_CREATE",
      email,
      "role=" + role + ";active=" + isActive + (password ? ";passwordChanged=1" : "") + (roleChanged ? ";roleChanged=1" : ""),
      "OK"
    );
    return { success: true, user: { email: email, name: name, role: role, projectId: "", isActive: isActive } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function upsertClientUserRow_(email, name, passwordHash, isActive, createdAt, existing) {
  var sheet = ensureClientUsersSheet_();
  if (existing && existing.sheetName === CONFIG.SHEET_CLIENT_USERS && existing.rowIndex) {
    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
    setSheetCellByHeader_(sheet, existing.rowIndex, headers, "name", sanitizeSheetCell_(name));
    if (passwordHash) setSheetCellByHeader_(sheet, existing.rowIndex, headers, "password", passwordHash);
    setSheetCellByHeader_(sheet, existing.rowIndex, headers, "isactive", isActive ? "TRUE" : "FALSE");
    return;
  }
  appendRowByHeader_(sheet, {
    email: email,
    name: sanitizeSheetCell_(name),
    password: passwordHash,
    isActive: isActive ? "TRUE" : "FALSE",
    createdAt: createdAt
  });
}

function upsertStaffUserRow_(email, name, role, passwordHash, isActive, createdAt, existing) {
  var sheet = ensureUsersSheet_();
  migrateUsersSheetColumns_(sheet);
  if (existing && existing.sheetName === CONFIG.SHEET_USERS && existing.rowIndex) {
    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
    setSheetCellByHeader_(sheet, existing.rowIndex, headers, "name", sanitizeSheetCell_(name));
    setSheetCellByHeader_(sheet, existing.rowIndex, headers, "role", role);
    if (passwordHash) setSheetCellByHeader_(sheet, existing.rowIndex, headers, "password", passwordHash);
    setSheetCellByHeader_(sheet, existing.rowIndex, headers, "isactive", isActive ? "TRUE" : "FALSE");
    return;
  }
  appendRowByHeader_(sheet, {
    email: email,
    name: sanitizeSheetCell_(name),
    role: role,
    password: passwordHash,
    isActive: isActive ? "TRUE" : "FALSE",
    createdAt: createdAt
  });
}

function setSheetCellByHeader_(sheet, rowIndex, headers, headerName, value) {
  var col = headers.indexOf(String(headerName || "").trim().toLowerCase());
  if (col < 0) return;
  sheet.getRange(rowIndex, col + 1).setValue(sanitizeSheetCell_(value));
}

function deleteUserRowByEmail_(sheet, email) {
  email = String(email || "").trim().toLowerCase();
  if (!sheet || !email || sheet.getLastRow() < 2) return false;
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var emailCol = headers.indexOf("email");
  if (emailCol < 0) emailCol = 0;
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][emailCol] || "").trim().toLowerCase() === email) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function setInternalUserActive(accessKey, email, isActive) {
  var ctx = requireDirectorRole_(accessKey);
  try {
    email = String(email || "").trim().toLowerCase();
    if (!email) return { success: false, error: "Email user wajib diisi." };
    if (email === ctx.email && String(isActive).toUpperCase() !== "TRUE" && isActive !== true) {
      return { success: false, error: "Tidak bisa menonaktifkan akun yang sedang dipakai login." };
    }

    var user = findUserByEmail_(email);
    if (!user || !user.rowIndex) return { success: false, error: "User tidak ditemukan." };
    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var sheet = ss.getSheetByName(user.sheetName || CONFIG.SHEET_USERS);
    if (!sheet) return { success: false, error: "User tidak ditemukan." };
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
      return String(h || "").trim().toLowerCase();
    });
    setSheetCellByHeader_(sheet, user.rowIndex, headers, "isactive", isActive ? "TRUE" : "FALSE");
    invalidateUserCache_(email);
    if (!isActive) revokeAllInternalSessions_(email);
    appendAuditLog_(ctx.email, isActive ? "USER_ACTIVATE" : "USER_DEACTIVATE", email, "role=" + String(user.role || ""), "OK");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ==========================================================================
// HAPUS AKUN CLIENT + CASCADE PEMBATALAN PROJECT
// Direktur menghapus akun client => seluruh project client itu dinyatakan batal
// dan datanya dibuang dari semua sheet. Satu-satunya yang ditahan: baris
// keuangan project yang sudah pernah menerima pembayaran, supaya pembukuan dan
// angka Analytics bulan-bulan sebelumnya tidak berubah retroaktif.
// ==========================================================================

// DriveAssets menyimpan folder dan file dalam satu sheet; keduanya butuh cara trash berbeda.
var PROJECT_FOLDER_ASSET_TYPES_ = { PROJECT_FOLDER: true, DEPT_FOLDER: true, EXTRA_FOLDER: true };
var FINANCE_ASSET_TYPES_ = { INVOICE_PDF: true, TRANSFER_PROOF: true };

/** Hapus baris yang cocok dari bawah ke atas, supaya indeks baris di bawahnya tidak bergeser. */
function deleteSheetRowsMatching_(sheet, matchFn) {
  if (!sheet || sheet.getLastRow() < 2) return 0;
  var data = sheet.getDataRange().getValues();
  var headerMap = getHeaderIndexMap_(data[0]);
  var removed = 0;
  for (var i = data.length - 1; i >= 1; i--) {
    if (!matchFn(data[i], headerMap)) continue;
    sheet.deleteRow(i + 1);
    removed++;
  }
  return removed;
}

/** Nama kolom project id berbeda tiap sheet (`id` di Leads, `projectId` di sisanya). */
function matchProjectIdColumn_(projectId, columnKey) {
  return function(row, headerMap) {
    var idx = headerMap[columnKey];
    if (idx === undefined) return false;
    return sameProjectId_(row[idx], projectId);
  };
}

/** Ambil projectId milik satu email dalam 2x baca sheet (hindari N+1 getLeadByProjectId_). */
function listProjectIdsByClientEmail_(ss, email) {
  email = String(email || "").trim().toLowerCase();
  var ids = [];
  if (!email) return ids;
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var seen = {};

  function addId(raw) {
    var pid = normalizeProjectId_(raw);
    if (!pid || seen[pid]) return;
    seen[pid] = true;
    ids.push(pid);
  }

  // Intake dibaca lebih dulu supaya Leads yang kolom email-nya kosong tetap bisa dipetakan.
  var intakeEmailByPid = {};
  var intake = ss.getSheetByName(CONFIG.SHEET_CLIENTS);
  if (intake && intake.getLastRow() > 1) {
    var idata = intake.getDataRange().getValues();
    var imap = getHeaderIndexMap_(idata[0]);
    if (imap.email !== undefined && imap.projectid !== undefined) {
      for (var j = 1; j < idata.length; j++) {
        var ipid = normalizeProjectId_(idata[j][imap.projectid]);
        var iemail = String(idata[j][imap.email] || "").trim().toLowerCase();
        if (!ipid || !iemail) continue;
        intakeEmailByPid[ipid] = iemail;
        if (iemail === email) addId(ipid);
      }
    }
  }

  var leads = ss.getSheetByName(CONFIG.SHEET_LEADS);
  if (leads && leads.getLastRow() > 1) {
    var ldata = leads.getDataRange().getValues();
    var lmap = getHeaderIndexMap_(ldata[0]);
    var idIdx = lmap.id !== undefined ? lmap.id : 0;
    for (var i = 1; i < ldata.length; i++) {
      var pid = normalizeProjectId_(ldata[i][idIdx]);
      if (!pid) continue;
      var rowEmail = lmap.email !== undefined ? String(ldata[i][lmap.email] || "").trim().toLowerCase() : "";
      if (!rowEmail) rowEmail = intakeEmailByPid[pid] || "";
      if (rowEmail === email) addId(pid);
    }
  }
  return ids;
}

function collectProjectPaymentIds_(ss, projectId) {
  var sheet = ss.getSheetByName(CONFIG.SHEET_PAYMENTS);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  var map = getHeaderIndexMap_(data[0]);
  if (map.projectid === undefined || map.paymentid === undefined) return [];
  var ids = [];
  for (var i = 1; i < data.length; i++) {
    if (!sameProjectId_(data[i][map.projectid], projectId)) continue;
    var payId = String(data[i][map.paymentid] || "").trim();
    if (payId && ids.indexOf(payId) < 0) ids.push(payId);
  }
  return ids;
}

/** Project yang sudah pernah menerima uang: baris keuangannya ditahan, tidak dihapus. */
function projectHasSettledMoney_(projectId) {
  try {
    if (getInvoiceCountForProject_(projectId) > 0) return true;
    return Number(getTotalPaidForProject_(projectId) || 0) > 0;
  } catch (err) {
    // Kalau statusnya tidak bisa dipastikan, tahan datanya. Lebih aman daripada
    // menghapus catatan uang yang ternyata sudah masuk.
    Logger.log("projectHasSettledMoney_ gagal (" + projectId + "): " + err.message);
    return true;
  }
}

/** Cari folder bukti transfer internal tanpa membuatnya kalau belum ada. */
function findInternalProofFolderForProject_(projectId) {
  try {
    var pid = String(normalizeProjectId_(projectId) || "").replace(/^#/, "");
    if (!pid) return null;
    var rootIt = DriveApp.getFolderById(getConfig_("DRIVE_FOLDER_ID")).getFoldersByName("_Internal_Payment_Proofs");
    if (!rootIt.hasNext()) return null;
    var sub = rootIt.next().getFoldersByName(pid);
    return sub.hasNext() ? sub.next() : null;
  } catch (err) {
    Logger.log("findInternalProofFolderForProject_ gagal: " + err.message);
    return null;
  }
}

/**
 * Cabut akses client lalu buang folder & file project ke Trash Drive (masih bisa
 * dipulihkan 30 hari). Aset keuangan ikut dibuang hanya kalau data keuangannya
 * juga dihapus.
 */
function purgeProjectDriveAssets_(ss, projectId, clientEmail, keepFinanceAssets, leadDriveUrl) {
  var result = { trashed: 0, rowsRemoved: 0 };
  var handled = {};

  function trashEntry(assetId, assetType) {
    assetId = String(assetId || "").trim();
    if (!assetId || handled[assetId]) return;
    handled[assetId] = true;
    var isFolder = !!PROJECT_FOLDER_ASSET_TYPES_[assetType];
    if (isFolder && isValidEmail_(clientEmail)) {
      // Folder di Trash masih membawa daftar share-nya, jadi akses client dicabut lebih dulu.
      try {
        revokeFolderClientAccessIfNeeded_(DriveApp.getFolderById(assetId), clientEmail);
      } catch (eAcl) {
        Logger.log("Revoke akses client gagal (" + assetId + "): " + eAcl.message);
      }
    }
    if (trashDriveAssetById_(assetId, isFolder ? "PROJECT_FOLDER" : assetType)) result.trashed++;
  }

  var sheet = ensureDriveAssetsSheet_(ss);
  if (sheet && sheet.getLastRow() > 1) {
    var data = sheet.getDataRange().getValues();
    var map = getHeaderIndexMap_(data[0]);
    if (map.projectid !== undefined) {
      for (var i = data.length - 1; i >= 1; i--) {
        if (!sameProjectId_(data[i][map.projectid], projectId)) continue;
        var assetType = map.assettype !== undefined
          ? String(data[i][map.assettype] || "").trim().toUpperCase()
          : "";
        if (keepFinanceAssets && FINANCE_ASSET_TYPES_[assetType]) continue;
        var assetId = map.assetid !== undefined ? String(data[i][map.assetid] || "").trim() : "";
        if (!assetId && map.asseturl !== undefined) assetId = extractDriveIdFromUrl_(data[i][map.asseturl]);
        trashEntry(assetId, assetType);
        sheet.deleteRow(i + 1);
        result.rowsRemoved++;
      }
    }
  }

  // Project lama bisa punya folder di kolom driveUrl tanpa baris DriveAssets.
  var leadFolderId = extractDriveIdFromUrl_(leadDriveUrl);
  if (leadFolderId) trashEntry(leadFolderId, "PROJECT_FOLDER");

  if (!keepFinanceAssets) {
    var proofFolder = findInternalProofFolderForProject_(projectId);
    if (proofFolder) {
      try {
        proofFolder.setTrashed(true);
        result.trashed++;
      } catch (eProof) {
        Logger.log("Trash folder bukti internal gagal: " + eProof.message);
      }
    }
  }
  return result;
}

/** Tandai baris keuangan yang ditahan supaya jelas project-nya sudah dibatalkan. */
function markRetainedPaymentAsCancelled_(ss, projectId, actorEmail) {
  var sheet = ss.getSheetByName(CONFIG.SHEET_PAYMENTS);
  if (!sheet || sheet.getLastRow() < 2) return 0;
  var data = sheet.getDataRange().getValues();
  var map = getHeaderIndexMap_(data[0]);
  if (map.projectid === undefined || map.notes === undefined) return 0;
  var note = "[BATAL] Project dibatalkan & akun client dihapus "
    + new Date().toLocaleString("id-ID") + " oleh " + (actorEmail || "Direktur") + ".";
  var touched = 0;
  for (var i = 1; i < data.length; i++) {
    if (!sameProjectId_(data[i][map.projectid], projectId)) continue;
    var prev = String(data[i][map.notes] || "").trim();
    sheet.getRange(i + 1, map.notes + 1).setValue(prev ? prev + " " + note : note);
    touched++;
  }
  return touched;
}

/**
 * Batalkan satu project dan buang datanya dari semua sheet terkait.
 * Tanggal shooting otomatis bebas karena index kalender dibangun dari baris Leads.
 */
function purgeProjectData_(ss, projectId, clientEmail, actorEmail) {
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var pid = normalizeProjectId_(projectId);
  var summary = {
    projectId: pid,
    clientName: "",
    shootingLabel: "",
    financeRetained: false,
    rowsRemoved: 0,
    driveTrashed: 0,
    removed: {}
  };
  if (!pid) return summary;

  var lead = null;
  try {
    lead = getLeadByProjectId_(pid);
  } catch (eLead) {
    Logger.log("Baca lead sebelum purge gagal (" + pid + "): " + eLead.message);
  }
  if (lead) {
    summary.clientName = lead.clientName || "";
    summary.shootingLabel = lead.shootingDateLabel || "";
    if (!clientEmail) clientEmail = lead.clientEmail || "";
  }

  var keepFinance = projectHasSettledMoney_(pid);
  summary.financeRetained = keepFinance;
  // paymentId dikumpulkan sebelum baris Payments dihapus, karena PaymentStatusHistory
  // tidak punya kolom projectId dan hanya bisa ditelusuri lewat paymentId.
  var paymentIds = keepFinance ? [] : collectProjectPaymentIds_(ss, pid);

  // Drive diproses sebelum baris DriveAssets ikut terhapus.
  var drive = purgeProjectDriveAssets_(ss, pid, clientEmail, keepFinance, lead ? lead.driveUrl : "");
  summary.driveTrashed = drive.trashed;
  if (drive.rowsRemoved) summary.removed[CONFIG.SHEET_DRIVE_ASSETS] = drive.rowsRemoved;

  var targets = [
    { name: CONFIG.SHEET_LEADS, key: "id" },
    { name: CONFIG.SHEET_CLIENTS, key: "projectid" },
    { name: CONFIG.SHEET_PROD_HIST, key: "projectid" },
    { name: "StatusHistory", key: "projectid" },
    { name: CONFIG.SHEET_PAY_APPROVALS, key: "projectid" },
    { name: CONFIG.SHEET_DEPT_APPROVALS, key: "projectid" }
  ];
  if (!keepFinance) {
    targets.push({ name: CONFIG.SHEET_PAYMENTS, key: "projectid" });
    targets.push({ name: CONFIG.SHEET_PAY_INVOICES, key: "projectid" });
  }
  targets.forEach(function(target) {
    var sheet = ss.getSheetByName(target.name);
    if (!sheet) return;
    var n = deleteSheetRowsMatching_(sheet, matchProjectIdColumn_(pid, target.key));
    if (n) summary.removed[target.name] = (summary.removed[target.name] || 0) + n;
  });

  if (paymentIds.length) {
    var histSheet = ss.getSheetByName(CONFIG.SHEET_PAY_HIST);
    if (histSheet) {
      var wanted = {};
      paymentIds.forEach(function(id) { wanted[String(id).trim().toLowerCase()] = true; });
      var histRemoved = deleteSheetRowsMatching_(histSheet, function(row, headerMap) {
        if (headerMap.paymentid === undefined) return false;
        return !!wanted[String(row[headerMap.paymentid] || "").trim().toLowerCase()];
      });
      if (histRemoved) summary.removed[CONFIG.SHEET_PAY_HIST] = histRemoved;
    }
  }

  if (keepFinance) markRetainedPaymentAsCancelled_(ss, pid, actorEmail);

  try {
    var props = PropertiesService.getScriptProperties();
    props.deleteProperty("ACL_STATE_" + pid);
    props.deleteProperty("ACL_STATE_" + pid.replace(/^#/, ""));
    props.deleteProperty(getDriveDeliveryPropKey_(pid));
  } catch (eProps) {
    Logger.log("Bersihkan script properties gagal (" + pid + "): " + eProps.message);
  }

  Object.keys(summary.removed).forEach(function(name) {
    summary.rowsRemoved += summary.removed[name];
  });
  return summary;
}

/**
 * Hapus permanen akun client beserta seluruh project-nya. Khusus Direktur.
 * Semua project client dinyatakan batal: baris di semua sheet dibuang, folder
 * Drive masuk Trash, dan tanggal shooting-nya kembali tersedia di kalender.
 */
function deleteClientUser(accessKey, email, options) {
  try {
    var ctx = requireInternalRole_(accessKey);
    if (String(ctx.role || "").trim().toUpperCase() !== "DIRECTOR") {
      return { success: false, error: "Hanya Direktur yang dapat menghapus akun client." };
    }
    options = options || {};
    email = String(email || "").trim().toLowerCase();
    if (!email) return { success: false, error: "Email akun client wajib diisi." };
    if (email === String(ctx.email || "").trim().toLowerCase()) {
      return { success: false, error: "Tidak bisa menghapus akun yang sedang dipakai login." };
    }
    if (email === String(CONFIG.EMAIL_FROM || "").trim().toLowerCase()) {
      return { success: false, error: "Akun Direktur utama tidak bisa dihapus." };
    }

    var user = findUserByEmail_(email);
    if (!user) return { success: false, error: "Akun tidak ditemukan." };
    var isClientAccount = user.sheetName === CONFIG.SHEET_CLIENT_USERS || isClientRole_(mapLoginRole_(user.role));
    if (!isClientAccount) {
      return { success: false, error: "Hanya akun client yang bisa dihapus dari sini. Akun tim internal harus dinonaktifkan, bukan dihapus." };
    }

    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var projectIds = listProjectIdsByClientEmail_(ss, email);
    if (projectIds.length && options.confirmProjects !== true) {
      return {
        success: false,
        needsProjectConfirm: true,
        projectCount: projectIds.length,
        projectIds: projectIds,
        error: "Akun ini masih tertaut ke " + projectIds.length + " project."
      };
    }

    // Booking baru tidak boleh menyerobot tanggal di tengah pembatalan.
    var lock = LockService.getScriptLock();
    var locked = false;
    try {
      locked = lock.tryLock(15000);
    } catch (eLock) {
      locked = false;
    }
    try {
      var purged = [];
      var financeRetained = [];
      var rowsRemoved = 0;
      var driveTrashed = 0;
      projectIds.forEach(function(pid) {
        var summary = purgeProjectData_(ss, pid, email, ctx.email);
        purged.push(summary);
        rowsRemoved += summary.rowsRemoved;
        driveTrashed += summary.driveTrashed;
        if (summary.financeRetained) financeRetained.push(summary.projectId);
      });

      var removed = deleteUserRowByEmail_(ensureClientUsersSheet_(), email);
      if (!removed && !projectIds.length) {
        return { success: false, error: "Baris akun client tidak ditemukan di sheet ClientUsers." };
      }

      revokeAllInternalSessions_(email);
      invalidateUserCache_(email);
      invalidateCache_(getClientPortalCacheKey_(email));
      // Kalender shooting, ops, prod ops, dan approval inbox semuanya ikut berubah.
      invalidateAllDataCaches_();

      appendAuditLog_(
        ctx.email,
        "CLIENT_DELETE",
        email,
        "projects=" + projectIds.length + ";rowsRemoved=" + rowsRemoved + ";driveTrashed=" + driveTrashed,
        "OK"
      );

      return {
        success: true,
        email: email,
        accountRemoved: removed,
        projectCount: projectIds.length,
        rowsRemoved: rowsRemoved,
        driveTrashed: driveTrashed,
        financeRetained: financeRetained,
        projects: purged
      };
    } finally {
      if (locked) {
        try { lock.releaseLock(); } catch (eRelease) {}
      }
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function invalidateUserCache_(email) {
  email = String(email || "").trim().toLowerCase();
  if (!email) return;
  if (_USER_MEMO) delete _USER_MEMO[email];
  try {
    var cache = CacheService.getScriptCache();
    cache.remove("fa_user_v2_" + email);
    cache.remove("fa_user_v3_" + email);
    cache.remove("fa_user_v4_" + email);
  } catch (e) {}
}

function findUserRowInSheet_(sheet, email, defaultRole) {
  if (!sheet || sheet.getLastRow() < 2) return null;
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var emailCol = headers.indexOf("email");
  var nameCol = headers.indexOf("name");
  var roleCol = headers.indexOf("role");
  var passwordCol = headers.indexOf("password");
  var activeCol = headers.indexOf("isactive");
  if (emailCol < 0) emailCol = 0;
  if (nameCol < 0) nameCol = 1;
  if (passwordCol < 0) passwordCol = roleCol >= 0 ? 3 : 2;
  if (activeCol < 0) activeCol = passwordCol + 1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][emailCol] || "").trim().toLowerCase() !== email) continue;
    var rawRole = roleCol >= 0 ? data[i][roleCol] : "";
    var roleValue = String(rawRole == null ? "" : rawRole).trim();
    if (!roleValue && defaultRole) roleValue = defaultRole;
    return {
      email: email,
      name: data[i][nameCol],
      role: roleValue,
      password: passwordCol >= 0 ? data[i][passwordCol] : "",
      isActive: data[i][activeCol],
      projectId: "",
      rowIndex: i + 1,
      passwordCol: passwordCol,
      sheetName: sheet.getName()
    };
  }
  return null;
}

function isUserActiveFlag_(value) {
  return isTruthyConsent_(value);
}

function isUsableLoginUser_(user) {
  if (!user) return false;
  if (!isUserActiveFlag_(user.isActive)) return false;
  if (!String(user.password || "").trim()) return false;
  return !!mapLoginRole_(String(user.role || "").trim().toUpperCase());
}

function hasRecognizedPasswordHash_(storedPassword) {
  storedPassword = String(storedPassword || "");
  // sha256: (tanpa salt) sengaja tidak dianggap usable untuk login.
  return storedPassword.indexOf("pbkdf2:") === 0
    || storedPassword.indexOf("sha256s:") === 0;
}

function isLegacyUnsaltedPasswordHash_(storedPassword) {
  return String(storedPassword || "").indexOf("sha256:") === 0;
}

function findUserByEmail_(email) {
  email = String(email || "").trim().toLowerCase();
  if (!email) return null;

  if (!_USER_MEMO) _USER_MEMO = {};
  if (_USER_MEMO[email] !== undefined) return _USER_MEMO[email];

  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get("fa_user_v4_" + email) || cache.get("fa_user_v3_" + email);
    if (cached) {
      var parsed = JSON.parse(cached);
      if (parsed && parsed.rowIndex && parsed.passwordCol >= 0) {
        var ssCached = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
        var cachedSheet = ssCached.getSheetByName(parsed.sheetName || CONFIG.SHEET_USERS);
        if (cachedSheet) {
          parsed.password = cachedSheet.getRange(parsed.rowIndex, parsed.passwordCol + 1).getValue();
        }
      }
      if (isUsableLoginUser_(parsed)) {
        _USER_MEMO[email] = parsed;
        return parsed;
      }
      try {
        cache.remove("fa_user_v4_" + email);
        cache.remove("fa_user_v3_" + email);
      } catch (rmErr) {}
    }
  } catch (e) {}

  var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var staffSheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!staffSheet) {
    try { staffSheet = ensureUsersSheet_(ss); } catch (ensureErr) {
      _USER_MEMO[email] = null;
      return null;
    }
  }

  var clientSheet = ss.getSheetByName(CONFIG.SHEET_CLIENT_USERS) || ensureClientUsersSheet_(ss);
  var staffHit = findUserRowInSheet_(staffSheet, email, "");
  var clientHit = findUserRowInSheet_(clientSheet, email, "CLIENT");
  // Prefer baris yang benar-benar bisa login. Row Users sisa/rusak
  // tidak boleh menimpa akun ClientUsers yang sehat.
  var found = null;
  if (isUsableLoginUser_(staffHit)) found = staffHit;
  else if (isUsableLoginUser_(clientHit)) found = clientHit;
  else found = staffHit || clientHit;

  _USER_MEMO[email] = found;
  try {
    if (found) {
      var cacheSafe = {
        email: found.email,
        name: found.name,
        role: found.role,
        isActive: found.isActive,
        projectId: "",
        rowIndex: found.rowIndex,
        passwordCol: found.passwordCol,
        sheetName: found.sheetName
      };
      CacheService.getScriptCache().put("fa_user_v4_" + email, JSON.stringify(cacheSafe), 120);
    }
  } catch (e2) {}
  return found;
}

var WEAK_PASSWORDS_ = {
  "password": 1, "password1": 1, "password123": 1, "passw0rd": 1,
  "12345678": 1, "123456789": 1, "1234567890": 1, "qwerty12": 1,
  "qwerty123": 1, "admin123": 1, "welcome1": 1, "letmein1": 1,
  "fastudio": 1, "fastudio1": 1, "fastudio123": 1, "changeme": 1,
  "indonesia": 1, "indonesia1": 1
};

/**
 * Kebijakan password: min 8, huruf + angka + simbol, bukan daftar lemah.
 * @return {{ok:boolean, error?:string}}
 */
function validatePasswordPolicy_(password) {
  password = String(password || "");
  if (!password) return { ok: false, error: "Password wajib diisi." };
  if (password.length < 8) {
    return { ok: false, error: "Password minimal 8 karakter, berisi huruf, angka, dan simbol." };
  }
  if (password.length > 128) {
    return { ok: false, error: "Password maksimal 128 karakter." };
  }
  if (/\s/.test(password)) {
    return { ok: false, error: "Password tidak boleh mengandung spasi." };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { ok: false, error: "Password harus berisi huruf." };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, error: "Password harus berisi angka." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { ok: false, error: "Password harus berisi simbol (contoh: @ # ! %)." };
  }
  var lowered = password.toLowerCase();
  if (WEAK_PASSWORDS_[lowered]) {
    return { ok: false, error: "Password terlalu umum. Pilih kombinasi yang lebih unik." };
  }
  if (/^(.)\1+$/.test(password)) {
    return { ok: false, error: "Password tidak boleh karakter yang diulang saja." };
  }
  return { ok: true };
}

function hashPassword_(password) {
  var iterations = PASSWORD_KDF_ITERATIONS_;
  var salt = generatePasswordSalt_();
  var hash = derivePasswordHashHex_(password, salt, iterations);
  return "pbkdf2:" + iterations + ":" + salt + ":" + hash;
}

function hashPasswordLegacySalted_(password) {
  var saltedInput = getOrCreatePasswordSalt_() + ":" + String(password || "");
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, saltedInput, Utilities.Charset.UTF_8);
  return "sha256s:" + bytesToHex_(bytes);
}

var PASSWORD_KDF_ITERATIONS_ = 1000;

function bytesToHex_(bytes) {
  return (bytes || []).map(function(b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
}

function generatePasswordSalt_() {
  return Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
}

/** Iterated SHA-256 KDF (GAS-native). Format storage: pbkdf2:iter:salt:hash */
function derivePasswordHashHex_(password, salt, iterations) {
  iterations = Math.max(1000, Number(iterations) || PASSWORD_KDF_ITERATIONS_);
  var material = String(salt || "") + "\u0000" + String(password || "");
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, material, Utilities.Charset.UTF_8);
  for (var i = 1; i < iterations; i++) {
    digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, digest);
  }
  return bytesToHex_(digest);
}

function isPasswordMatch_(plainPassword, storedPassword) {
  if (!plainPassword) return false;
  storedPassword = String(storedPassword || "");
  if (!storedPassword) return false;
  if (storedPassword.indexOf("pbkdf2:") === 0) {
    var parts = storedPassword.split(":");
    if (parts.length !== 4) return false;
    var iterations = Number(parts[1]);
    var salt = parts[2];
    var expected = parts[3];
    if (!iterations || !salt || !expected) return false;
    return expected === derivePasswordHashHex_(plainPassword, salt, iterations);
  }
  if (storedPassword.indexOf("sha256s:") === 0) {
    return storedPassword === hashPasswordLegacySalted_(plainPassword);
  }
  // sha256: tanpa salt ditolak — akun harus reset password.
  return false;
}

// KDF pbkdf2 butuh 1000 digest berurutan, mahal di Apps Script. Hasil verifikasi
// yang sudah benar disimpan sebentar supaya login berulang tidak mengulang KDF.
var PASSWORD_VERIFIER_TTL_ = 600; // 10 menit
var _PASSWORD_VERIFY_FROM_CACHE_ = false;

/**
 * Sidik jari verifikasi: butuh password plaintext untuk dihitung, jadi isi cache
 * tidak bisa dipakai balik untuk menebak password. Hash tersimpan ikut masuk
 * material supaya cache otomatis gugur begitu password diganti.
 */
function passwordVerifierCacheKey_(email, storedPassword, plainPassword) {
  var material = [
    getOrCreatePasswordSalt_(),
    String(email || "").trim().toLowerCase(),
    String(storedPassword || ""),
    String(plainPassword || "")
  ].join("\u0000");
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, material, Utilities.Charset.UTF_8);
  return "pwok_" + bytesToHex_(bytes);
}

function isPasswordMatchCached_(email, plainPassword, storedPassword) {
  _PASSWORD_VERIFY_FROM_CACHE_ = false;
  if (!plainPassword) return false;
  storedPassword = String(storedPassword || "");
  if (!storedPassword) return false;
  // Format non-pbkdf2 hanya 1 digest, tidak perlu cache.
  if (storedPassword.indexOf("pbkdf2:") !== 0) {
    return isPasswordMatch_(plainPassword, storedPassword);
  }
  var cacheKey = "";
  try {
    cacheKey = passwordVerifierCacheKey_(email, storedPassword, plainPassword);
    if (CacheService.getScriptCache().get(cacheKey) === "1") {
      _PASSWORD_VERIFY_FROM_CACHE_ = true;
      return true;
    }
  } catch (e) {}
  var matched = isPasswordMatch_(plainPassword, storedPassword);
  if (matched && cacheKey) {
    try { CacheService.getScriptCache().put(cacheKey, "1", PASSWORD_VERIFIER_TTL_); } catch (e2) {}
  }
  return matched;
}

function migratePasswordHashIfNeeded_(user, plainPassword, storedPassword) {
  try {
    if (!user || user.passwordCol < 0 || !user.rowIndex) return;
    storedPassword = String(storedPassword || "");
    if (storedPassword.indexOf("pbkdf2:") === 0) return;
    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var sheet = ss.getSheetByName(user.sheetName || CONFIG.SHEET_USERS);
    if (sheet) {
      sheet.getRange(user.rowIndex, user.passwordCol + 1).setValue(hashPassword_(plainPassword));
      // Hash berubah → revoke sesi lama. Sesi baru dibuat setelah fungsi ini return.
      revokeAllInternalSessions_(user.email || "");
      invalidateUserCache_(user.email || "");
    }
  } catch (e) {
    Logger.log("Migrasi password hash gagal: " + e.message);
  }
}

function getInternalSessionsIndexKey_(email) {
  return "internal_sessions_" + String(email || "").trim().toLowerCase();
}

function getInternalSessionPropKey_(token) {
  return "isess_" + String(token || "").trim();
}

var SESSION_TTL_SECONDS_ = 21600; // 6 jam (maks CacheService)
var SESSION_TTL_MS_ = SESSION_TTL_SECONDS_ * 1000;
/** Refresh PropertiesService paling sering tiap 30 menit (kuota write). */
var SESSION_TOUCH_DURABLE_MIN_MS_ = 30 * 60 * 1000;

function rememberInternalSession_(email, token, persistDurable) {
  email = String(email || "").trim().toLowerCase();
  token = String(token || "").trim();
  if (!email || !token) return;
  var cache = CacheService.getScriptCache();
  var key = getInternalSessionsIndexKey_(email);
  var raw = cache.get(key) || "";
  var tokens = raw ? raw.split(",").filter(Boolean) : [];
  if (tokens.indexOf(token) < 0) tokens.push(token);
  if (tokens.length > 20) tokens = tokens.slice(-20);
  cache.put(key, tokens.join(","), SESSION_TTL_SECONDS_);
  if (persistDurable) {
    try {
      PropertiesService.getScriptProperties().setProperty(
        getInternalSessionPropKey_(token),
        email + "|" + String(Date.now())
      );
    } catch (e) {}
  }
}

function revokeAllInternalSessions_(email) {
  email = String(email || "").trim().toLowerCase();
  if (!email) return;
  var cache = CacheService.getScriptCache();
  var key = getInternalSessionsIndexKey_(email);
  var raw = cache.get(key) || "";
  var props = null;
  try { props = PropertiesService.getScriptProperties(); } catch (e) {}
  if (raw) {
    raw.split(",").forEach(function(token) {
      token = String(token || "").trim();
      if (!token) return;
      cache.remove("internal_session_" + token);
      if (props) {
        try { props.deleteProperty(getInternalSessionPropKey_(token)); } catch (e2) {}
      }
    });
  }
  cache.remove(key);
}

function destroyInternalSession_(token) {
  token = String(token || "").trim();
  if (!token) return;
  var cache = CacheService.getScriptCache();
  var email = cache.get("internal_session_" + token);
  cache.remove("internal_session_" + token);
  try {
    var props = PropertiesService.getScriptProperties();
    var prop = props.getProperty(getInternalSessionPropKey_(token));
    if (!email && prop) email = String(prop.split("|")[0] || "");
    props.deleteProperty(getInternalSessionPropKey_(token));
  } catch (e) {}
  if (email) {
    var key = getInternalSessionsIndexKey_(email);
    var raw = cache.get(key) || "";
    if (raw) {
      var next = raw.split(",").filter(function(t) { return t && t !== token; });
      if (next.length) cache.put(key, next.join(","), SESSION_TTL_SECONDS_);
      else cache.remove(key);
    }
  }
}

function createInternalSession_(email) {
  var token = Utilities.getUuid() + "-" + Utilities.getUuid();
  email = String(email || "").toLowerCase();
  CacheService.getScriptCache().put("internal_session_" + token, email, SESSION_TTL_SECONDS_);
  rememberInternalSession_(email, token, true);
  return token;
}

function touchInternalSession_(email, token) {
  email = String(email || "").trim().toLowerCase();
  token = String(token || "").trim();
  if (!email || !token) return;
  try {
    CacheService.getScriptCache().put("internal_session_" + token, email, SESSION_TTL_SECONDS_);
    rememberInternalSession_(email, token, false);
  } catch (e) {}
  // Sliding TTL di PropertiesService — perpanjang masa hidup sesi saat ada aktivitas.
  try {
    var props = PropertiesService.getScriptProperties();
    var propKey = getInternalSessionPropKey_(token);
    var raw = props.getProperty(propKey);
    var now = Date.now();
    if (!raw) {
      props.setProperty(propKey, email + "|" + String(now));
      return;
    }
    var lastTouch = Number(String(raw).split("|")[1] || 0);
    if (!lastTouch || (now - lastTouch) >= SESSION_TOUCH_DURABLE_MIN_MS_) {
      props.setProperty(propKey, email + "|" + String(now));
    }
  } catch (e2) {}
}

function validateInternalSession_(email, token) {
  email = String(email || "").trim().toLowerCase();
  token = String(token || "").trim();
  if (!email || !token) return false;
  var cachedEmail = CacheService.getScriptCache().get("internal_session_" + token);
  if (cachedEmail && cachedEmail === email) return true;

  // Fallback tahan eviction: timestamp = last activity (sliding TTL).
  try {
    var raw = PropertiesService.getScriptProperties().getProperty(getInternalSessionPropKey_(token));
    if (!raw) return false;
    var parts = String(raw).split("|");
    var storedEmail = String(parts[0] || "").trim().toLowerCase();
    var lastTouch = Number(parts[1] || 0);
    if (storedEmail !== email) return false;
    if (lastTouch && (Date.now() - lastTouch) > SESSION_TTL_MS_) {
      try { PropertiesService.getScriptProperties().deleteProperty(getInternalSessionPropKey_(token)); } catch (e2) {}
      return false;
    }
    CacheService.getScriptCache().put("internal_session_" + token, email, SESSION_TTL_SECONDS_);
    rememberInternalSession_(email, token, false);
    return true;
  } catch (e) {
    return false;
  }
}

function requireLoginRole_(credential) {
  var parts = parseInternalCredential_(credential);
  var normalizedEmail = parts.email;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    var user = findUserByEmail_(normalizedEmail);
    var isActive = user && isUserActiveFlag_(user.isActive);
    var role = user ? String(user.role || "").trim().toUpperCase() : "";
    var hasValidSession = validateInternalSession_(normalizedEmail, parts.token);
    var mappedRole = mapLoginRole_(role);
    if (user && mappedRole && isActive && hasValidSession) {
      touchInternalSession_(normalizedEmail, parts.token);
      return {
        role: mappedRole,
        email: normalizedEmail,
        name: user.name || "",
        projectId: getUserProjectId_(user)
      };
    }
  }
  throw new Error("Sesi tidak valid atau sudah berakhir. Silakan masuk kembali.");
}

function requireInternalRole_(credential) {
  var ctx = requireLoginRole_(credential);
  if (!isOpsOfficeRole_(ctx.role)) {
    throw new Error("Akses ditolak. Hanya Officer/Direktur yang boleh mengakses fitur ini.");
  }
  return ctx;
}

/** PIC, Officer, atau Direktur — hanya untuk Production Ops. */
function requireProductionOpsRole_(credential) {
  var ctx = requireLoginRole_(credential);
  if (isClientRole_(ctx.role) || !mapInternalAccessRole_(ctx.role)) {
    throw new Error("Akses ditolak. Hanya tim produksi yang boleh mengakses fitur ini.");
  }
  return ctx;
}

function validateInternalSession(accessKey) {
  try {
    var ctx = requireLoginRole_(accessKey);
    var sessionRes = {
      success: true,
      email: ctx.email,
      name: ctx.name || ctx.email,
      role: ctx.role,
      homeView: getHomeViewForRole_(ctx.role),
      projectId: ctx.projectId || ""
    };
    // Sertakan data dashboard bila cache masih hangat supaya reload halaman
    // langsung tampil tanpa round-trip tambahan.
    if (isClientRole_(ctx.role)) {
      try {
        var cachedPortal = buildClientPortalPayloadForCtx_(ctx, { cacheOnly: true });
        if (cachedPortal) sessionRes.portal = cachedPortal;
      } catch (portalErr) {}
    }
    if (!isClientRole_(ctx.role) && !isDeptPicRole_(ctx.role)) {
      try {
        var warm = buildOperationDataFromCache_(ctx);
        if (warm) sessionRes.opsData = stripInternalFields_(warm);
      } catch (warmErr) {}
    }
    return sessionRes;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function logoutInternalSession(accessKey) {
  try {
    var parts = parseInternalCredential_(accessKey);
    destroyInternalSession_(parts.token);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getInternalAccessRoleByEmail_(email) {
  var user = findUserByEmail_(email);
  if (!user) return "OFFICER";
  return mapInternalAccessRole_(user.role) || "OFFICER";
}

function requireDirectorRole_(credential) {
  var ctx = requireInternalRole_(credential);
  if (ctx.role !== "DIRECTOR") {
    throw new Error("Akses ditolak. Hanya Direktur yang boleh mengakses fitur ini.");
  }
  return ctx;
}

/** Four-eyes: reviewer tidak boleh menyetujui pengajuan miliknya sendiri. */
function assertNotSelfApprover_(ctx, submittedBy) {
  var reviewer = String(ctx && ctx.email || "").trim().toLowerCase();
  var submitter = String(submittedBy || "").trim().toLowerCase();
  if (reviewer && submitter && reviewer === submitter) {
    throw new Error("Tidak bisa menyetujui pengajuan milik sendiri. Minta Direktur lain untuk mereview.");
  }
}

function parseInternalCredential_(credential) {
  try {
    var parsed = JSON.parse(String(credential || "{}"));
    return {
      email: String(parsed.email || "").trim().toLowerCase(),
      password: String(parsed.password || ""),
      token: String(parsed.token || "")
    };
  } catch (e) {
    return { email: String(credential || "").trim().toLowerCase(), password: "", token: "" };
  }
}

function migrateUsersSheetColumns_(sheet) {
  var lastCol = Math.max(1, sheet.getLastColumn());
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || "").trim().toLowerCase();
  });
  if (headers.indexOf("password") < 0) {
    var roleCol = headers.indexOf("role");
    var insertAfter = roleCol >= 0 ? roleCol + 1 : Math.min(3, sheet.getLastColumn());
    sheet.insertColumnAfter(insertAfter);
    sheet.getRange(1, insertAfter + 1).setValue("password");
    lastCol = Math.max(1, sheet.getLastColumn());
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
      return String(h || "").trim().toLowerCase();
    });
  }
  if (headers.indexOf("createdat") < 0) {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue("createdAt");
  }
}

function migrateClientIntakeSheetColumns_(sheet) {
  var required = [
    "timestamp", "brandName", "whatsapp", "email", "representativeType",
    "projectType", "budgetRange", "projectTotal", "pic", "totalMurid",
    "shootingDays", "shootingStartDate", "shootingEndDate", "shootingDateLabel",
    "briefNarrative",
    "emailOtpVerified", "agreementAccepted", "pdpPolicyVersion", "status", "projectId", "createdAt"
  ];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return String(h || "").trim();
  });
  required.forEach(function(header) {
    if (headers.indexOf(header) < 0) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      headers.push(header);
    }
  });
}

function appendRowByHeader_(sheet, rowObj) {
  var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0].map(function(h) {
    return String(h || "").trim();
  });
  var normalized = {};
  Object.keys(rowObj || {}).forEach(function(key) {
    normalized[String(key).trim().toLowerCase()] = rowObj[key];
  });
  var row = headers.map(function(header) {
    var key = String(header || "").trim().toLowerCase();
    if (!key) return "";
    return normalized[key] !== undefined ? sanitizeSheetCell_(normalized[key]) : "";
  });
  // Guard: jika header "id"/"projectid" tidak ketemu, fallback tulis di kolom pertama.
  var hasIdHeader = headers.some(function(h) {
    var key = String(h || "").trim().toLowerCase();
    return key === "id" || key === "projectid";
  });
  if (!hasIdHeader && (normalized.id || normalized.projectid)) {
    row[0] = sanitizeSheetCell_(normalized.id || normalized.projectid);
  }
  sheet.appendRow(row);
  return row;
}

function getHeaderIndexMap_(headers) {
  var map = {};
  (headers || []).forEach(function(h, idx) {
    var key = String(h || "").trim().toLowerCase();
    if (key && map[key] === undefined) map[key] = idx;
  });
  return map;
}

function getRowValueByHeader_(row, headerMap, keys, fallback) {
  for (var i = 0; i < keys.length; i++) {
    var idx = headerMap[keys[i]];
    if (idx !== undefined && row[idx] !== undefined && row[idx] !== "") return row[idx];
  }
  return fallback !== undefined ? fallback : "";
}

function ensureLeadExistsFromIntake_(ss, projectId, intakeData) {
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  projectId = normalizeProjectId_(projectId);
  if (!projectId) return false;

  var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
  if (!leadsSheet) return false;
  migrateLeadsSheetColumns_(leadsSheet);

  var leadData = leadsSheet.getDataRange().getValues();
  if (leadData.length > 1) {
    var leadHeaders = leadData[0];
    var leadMap = getHeaderIndexMap_(leadHeaders);
    var idIdx = leadMap.id !== undefined ? leadMap.id : 0;
    for (var i = 1; i < leadData.length; i++) {
      if (normalizeProjectId_(leadData[i][idIdx]) === projectId) return false;
    }
  }

  intakeData = intakeData || {};
  var projectTotal = parseProjectTotal_(intakeData.projectTotal);
  var timestamp = intakeData.timestamp || intakeData.createdAt || new Date().toLocaleString("id-ID");
  var picName = intakeData.pic || intakeData.picName || "";
  var totalMurid = intakeData.totalMurid || "";
  var notes = [
    "WhatsApp: " + (intakeData.whatsapp || "-"),
    "Mewakili: " + (intakeData.representativeType || "-"),
    "Total Harga: " + formatRupiahId_(projectTotal),
    "PIC: " + (picName || "-")
  ];
  if (intakeData.shootingDateLabel) notes.push("Jadwal Shooting: " + intakeData.shootingDateLabel);
  if (totalMurid) notes.push("Total Murid: " + totalMurid);
  notes = notes.join(" | ");

  var scheduleFallback = normalizeShootingSchedule_(intakeData);
  appendRowByHeader_(leadsSheet, {
    id: projectId.indexOf("#") === 0 ? projectId : "#" + projectId.replace(/^#/, ""),
    client: intakeData.brandName || intakeData.client || "",
    category: intakeData.projectType || intakeData.category || "",
    status: intakeData.status || "New Lead",
    driveUrl: "",
    timestamp: timestamp,
    pic: picName,
    notes: notes + " | Brief: " + (intakeData.briefNarrative || "-"),
    email: intakeData.email || "",
    productionStage: "On Discuss",
    postProductionProgress: "",
    productionUpdatedAt: timestamp,
    productionUpdatedBy: "System",
    productionNotes: "Backfill dari ClientIntake. Total harga kesepakatan " + formatRupiahId_(projectTotal) + ".",
    projectTotal: projectTotal || "",
    totalMurid: totalMurid || "",
    shootingDays: scheduleFallback.error ? "" : scheduleFallback.shootingDays,
    shootingStartDate: scheduleFallback.error ? "" : scheduleFallback.shootingStartDate,
    shootingEndDate: scheduleFallback.error ? "" : scheduleFallback.shootingEndDate,
    shootingDateLabel: scheduleFallback.error ? (intakeData.shootingDateLabel || "") : scheduleFallback.shootingDateLabel
  });
  return true;
}

// Backfill = perbaikan data (bikin Lead dari ClientIntake yang belum punya baris).
// Tidak perlu dijalankan pada setiap pembacaan; penandanya dibuang tiap ada operasi tulis
// (lihat invalidateAllDataCaches_) sehingga booking baru tetap langsung terbawa.
function backfillLeadsFromClientIntakeThrottled_(ss) {
  try {
    if (CacheService.getScriptCache().get(CACHE_KEY_BACKFILL_DONE) === "1") return 0;
  } catch (e) {}
  var created = backfillLeadsFromClientIntake_(ss);
  try {
    CacheService.getScriptCache().put(CACHE_KEY_BACKFILL_DONE, "1", SCHEMA_GUARD_TTL_);
  } catch (e) {}
  return created;
}

function backfillLeadsFromClientIntake_(ss) {
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var intakeSheet = ss.getSheetByName(CONFIG.SHEET_CLIENTS);
  var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
  if (!intakeSheet || !leadsSheet || intakeSheet.getLastRow() < 2) return 0;

  migrateLeadsSheetColumns_(leadsSheet);
  migrateClientIntakeSheetColumns_(intakeSheet);

  var intakeData = intakeSheet.getDataRange().getValues();
  var intakeHeaders = intakeData[0];
  var intakeMap = getHeaderIndexMap_(intakeHeaders);
  var created = 0;

  // Bangun set project ID Leads yang sudah ada SEKALI — hindari baca sheet Leads penuh per baris intake.
  var existingLeadIds = {};
  var leadData = leadsSheet.getDataRange().getValues();
  if (leadData.length > 1) {
    var leadMap = getHeaderIndexMap_(leadData[0]);
    var leadIdIdx = leadMap.id !== undefined ? leadMap.id : 0;
    for (var li = 1; li < leadData.length; li++) {
      var existingId = normalizeProjectId_(leadData[li][leadIdIdx]);
      if (existingId) existingLeadIds[existingId] = true;
    }
  }

  for (var i = 1; i < intakeData.length; i++) {
    var row = intakeData[i];
    var projectId = getRowValueByHeader_(row, intakeMap, ["projectid", "id"]);
    if (!projectId) continue;
    // Skip cepat kalau lead sudah ada (mayoritas kasus) tanpa baca ulang sheet Leads.
    if (existingLeadIds[normalizeProjectId_(projectId)]) continue;
    var payload = {
      brandName: getRowValueByHeader_(row, intakeMap, ["brandname", "client"]),
      projectType: getRowValueByHeader_(row, intakeMap, ["projecttype", "category"]),
      status: getRowValueByHeader_(row, intakeMap, ["status"], "New Lead"),
      whatsapp: getRowValueByHeader_(row, intakeMap, ["whatsapp"]),
      representativeType: getRowValueByHeader_(row, intakeMap, ["representativetype"]),
      projectTotal: getRowValueByHeader_(row, intakeMap, ["projecttotal"]),
      pic: getRowValueByHeader_(row, intakeMap, ["pic"]),
      totalMurid: getRowValueByHeader_(row, intakeMap, ["totalmurid"]),
      shootingDays: getRowValueByHeader_(row, intakeMap, ["shootingdays"]),
      shootingStartDate: toShootingIsoDate_(getRowValueByHeader_(row, intakeMap, ["shootingstartdate"])),
      shootingEndDate: toShootingIsoDate_(getRowValueByHeader_(row, intakeMap, ["shootingenddate"])),
      shootingDateLabel: getRowValueByHeader_(row, intakeMap, ["shootingdatelabel"]),
      briefNarrative: getRowValueByHeader_(row, intakeMap, ["briefnarrative"]),
      email: getRowValueByHeader_(row, intakeMap, ["email"]),
      timestamp: getRowValueByHeader_(row, intakeMap, ["timestamp", "createdat"]),
      createdAt: getRowValueByHeader_(row, intakeMap, ["createdat", "timestamp"])
    };
    if (ensureLeadExistsFromIntake_(ss, projectId, payload)) {
      created++;
      existingLeadIds[normalizeProjectId_(projectId)] = true;
    }
  }
  return created;
}

function extractProjectFolderUrl_(value) {
  var text = String(value || "").trim();
  if (!text) return "";
  var match = text.match(/https:\/\/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/[a-zA-Z0-9_-]+/i);
  return match ? match[0] : "";
}

function getProjectDriveUrlMap_(ss) {
  if (_PROJECT_DRIVE_URL_MAP_CACHE) return _PROJECT_DRIVE_URL_MAP_CACHE;
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var map = {};
  var assetSheet = ss.getSheetByName(CONFIG.SHEET_DRIVE_ASSETS);
  if (!assetSheet || assetSheet.getLastRow() < 2) {
    _PROJECT_DRIVE_URL_MAP_CACHE = map;
    return map;
  }

  var assetData = assetSheet.getDataRange().getValues();
  for (var i = 1; i < assetData.length; i++) {
    if (String(assetData[i][2] || "").trim() !== "PROJECT_FOLDER") continue;
    if (String(assetData[i][7] || "").trim().toUpperCase() === "TRUE") continue;
    var pid = normalizeProjectId_(assetData[i][1]);
    var url = extractProjectFolderUrl_(assetData[i][4]);
    if (pid && url) map[pid] = url;
  }
  _PROJECT_DRIVE_URL_MAP_CACHE = map;
  return map;
}

function getDeptFolderMap_(ss) {
  var catalogMap = getOpsFolderCatalogMap_(ss);
  var map = {};
  Object.keys(catalogMap).forEach(function(pid) {
    map[pid] = {};
    (catalogMap[pid] || []).forEach(function(folder) {
      if (folder && folder.id && folder.url) map[pid][folder.id] = folder.url;
    });
  });
  return map;
}

function getOpsFolderCatalogMap_(ss) {
  if (_OPS_FOLDER_CATALOG_CACHE) return _OPS_FOLDER_CATALOG_CACHE;
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var map = {};
  var assetSheet = ss.getSheetByName(CONFIG.SHEET_DRIVE_ASSETS);
  if (!assetSheet || assetSheet.getLastRow() < 2) {
    _OPS_FOLDER_CATALOG_CACHE = map;
    return map;
  }
  var assetData = assetSheet.getDataRange().getValues();
  var seen = {};
  for (var i = 1; i < assetData.length; i++) {
    var assetType = String(assetData[i][2] || "").trim();
    if (assetType !== "DEPT_FOLDER" && assetType !== "EXTRA_FOLDER") continue;
    if (String(assetData[i][7] || "").trim().toUpperCase() === "TRUE") continue;
    var pid = normalizeProjectId_(assetData[i][1]);
    var folderName = String(assetData[i][5] || "").trim();
    var url = extractProjectFolderUrl_(assetData[i][4]);
    if (!pid || !folderName || !url) continue;
    var id = slugifyFolderName_(folderName);
    var dedupeKey = pid + "::" + id;
    if (seen[dedupeKey]) continue;
    seen[dedupeKey] = true;
    if (!map[pid]) map[pid] = [];
    map[pid].push({
      id: id,
      label: folderName,
      url: url,
      order: map[pid].length + 1
    });
  }
  Object.keys(map).forEach(function(pid) {
    map[pid] = sortOpsFolderCatalog_(map[pid]);
  });
  _OPS_FOLDER_CATALOG_CACHE = map;
  return map;
}

function getOpsFolderCatalogForProject_(projectId, ss) {
  projectId = normalizeProjectId_(projectId);
  var catalogMap = getOpsFolderCatalogMap_(ss);
  return catalogMap[projectId] || [];
}

function syncProjectDriveFolderCatalog_(projectId, parentFolderId) {
  projectId = normalizeProjectId_(projectId);
  if (!parentFolderId) return getOpsFolderCatalogForProject_(projectId);
  try {
    var parentFolder = DriveApp.getFolderById(parentFolderId);
    var children = parentFolder.getFolders();
    while (children.hasNext()) {
      var child = children.next();
      var name = String(child.getName() || "").trim();
      if (!name) continue;
      logDriveAsset_(projectId, "DEPT_FOLDER", child.getUrl(), child.getId(), name, "DriveSync");
    }
    return getOpsFolderCatalogForProject_(projectId);
  } catch (e) {
    Logger.log("syncProjectDriveFolderCatalog_ gagal: " + e.message);
    return getOpsFolderCatalogForProject_(projectId);
  }
}

function ensureDeptFoldersForProject_(projectId, parentFolderId) {
  if (!parentFolderId) return {};
  try {
    var parentFolder = DriveApp.getFolderById(parentFolderId);
    var existingBySlug = {};
    var children = parentFolder.getFolders();
    while (children.hasNext()) {
      var child = children.next();
      existingBySlug[slugifyFolderName_(child.getName())] = child;
    }

    getProductionOpsFolderTemplate_().forEach(function(name) {
      var slug = slugifyFolderName_(name);
      var folder = existingBySlug[slug];
      if (!folder) {
        folder = parentFolder.createFolder(name);
      }
      logDriveAsset_(projectId, "DEPT_FOLDER", folder.getUrl(), folder.getId(), name, "ProductionOps");
    });

    var catalog = syncProjectDriveFolderCatalog_(projectId, parentFolderId);
    var map = {};
    catalog.forEach(function(folder) {
      map[folder.id] = folder.url;
    });
    return map;
  } catch (e) {
    Logger.log("ensureDeptFoldersForProject_ gagal: " + e.message);
    return {};
  }
}

function syncProductionOpsFolders(accessKey, projectId) {
  try {
    requireProductionOpsRole_(accessKey);
    initializeGoogleSheets_();
    projectId = normalizeProjectId_(projectId);
    if (!projectId) return { success: false, error: "Project ID wajib diisi.", catalog: [], deptFolderMap: {} };

    var lead = getLeadByProjectId_(projectId);
    var driveUrl = lead ? lead.driveUrl : "";
    var folderId = extractDriveIdFromUrl_(driveUrl);
    var catalog = folderId
      ? syncProjectDriveFolderCatalog_(projectId, folderId)
      : getOpsFolderCatalogForProject_(projectId);

    var deptFolderMap = {};
    catalog.forEach(function(folder) {
      deptFolderMap[folder.id] = folder.url;
    });

    return {
      success: true,
      projectId: projectId,
      catalog: catalog,
      deptFolderMap: deptFolderMap
    };
  } catch (err) {
    return { success: false, error: err.message, catalog: [], deptFolderMap: {} };
  }
}

function findDriveUrlInLeadRow_(row, headerMap) {
  var driveIdx = headerMap.driveurl;
  if (driveIdx !== undefined) {
    var fromDriveCol = extractProjectFolderUrl_(row[driveIdx]);
    if (fromDriveCol) return fromDriveCol;
  }
  if (driveIdx !== undefined && driveIdx !== 4) {
    var fromLegacyIdx = extractProjectFolderUrl_(row[4]);
    if (fromLegacyIdx) return fromLegacyIdx;
  }
  var notesIdx = headerMap.notes;
  if (notesIdx !== undefined) {
    var fromNotes = extractProjectFolderUrl_(row[notesIdx]);
    if (fromNotes) return fromNotes;
  }
  for (var i = 0; i < row.length; i++) {
    var fromCell = extractProjectFolderUrl_(row[i]);
    if (fromCell) return fromCell;
  }
  return "";
}

// Perbaikan data Leads: isi ulang PIC / totalMurid dari ClientIntake dan driveUrl dari DriveAssets.
function repairLeadsMissingPic_() {
  var ss = arguments[0] || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
  var intakeSheet = ss.getSheetByName(CONFIG.SHEET_CLIENTS);
  if (!leadsSheet || !intakeSheet) return { success: false, error: "Sheet Leads/ClientIntake tidak ditemukan." };

  migrateLeadsSheetColumns_(leadsSheet);
  migrateClientIntakeSheetColumns_(intakeSheet);

  var intakeData = intakeSheet.getDataRange().getValues();
  var intakeHeaders = intakeData[0];
  var intakeMap = getHeaderIndexMap_(intakeHeaders);
  var intakeByProjectId = {};
  for (var i = 1; i < intakeData.length; i++) {
    var pid = normalizeProjectId_(getRowValueByHeader_(intakeData[i], intakeMap, ["projectid", "id"]));
    if (!pid) continue;
    intakeByProjectId[pid] = {
      pic: getRowValueByHeader_(intakeData[i], intakeMap, ["pic"]),
      totalMurid: getRowValueByHeader_(intakeData[i], intakeMap, ["totalmurid"])
    };
  }

  var driveByProject = getProjectDriveUrlMap_(ss);
  var leadsData = leadsSheet.getDataRange().getValues();
  var leadHeaders = leadsData[0];
  var leadMap = getHeaderIndexMap_(leadHeaders);
  var idIdx = leadMap.id !== undefined ? leadMap.id : 0;
  var picIdx = leadMap.pic;
  var muridIdx = leadMap.totalmurid;
  var driveIdx = leadMap.driveurl;
  var repaired = 0;
  var repairedDrive = 0;

  for (var r = 1; r < leadsData.length; r++) {
    var leadPid = normalizeProjectId_(leadsData[r][idIdx]);
    if (!leadPid) continue;
    var intakeRow = intakeByProjectId[leadPid] || {};
    var changed = false;

    if (picIdx !== undefined && !String(leadsData[r][picIdx] || "").trim() && intakeRow.pic) {
      leadsSheet.getRange(r + 1, picIdx + 1).setValue(intakeRow.pic);
      changed = true;
    }
    if (muridIdx !== undefined && !String(leadsData[r][muridIdx] || "").trim() && intakeRow.totalMurid) {
      leadsSheet.getRange(r + 1, muridIdx + 1).setValue(intakeRow.totalMurid);
      changed = true;
    }

    var currentDrive = driveIdx !== undefined ? String(leadsData[r][driveIdx] || "").trim() : "";
    var restoredDrive = currentDrive || driveByProject[leadPid] || findDriveUrlInLeadRow_(leadsData[r], leadMap);
    if (!currentDrive && restoredDrive) {
      if (driveIdx === undefined) {
        migrateLeadsSheetColumns_(leadsSheet);
        leadsData = leadsSheet.getDataRange().getValues();
        leadHeaders = leadsData[0];
        leadMap = getHeaderIndexMap_(leadHeaders);
        driveIdx = leadMap.driveurl;
      }
      if (driveIdx !== undefined) {
        leadsSheet.getRange(r + 1, driveIdx + 1).setValue(restoredDrive);
        logDriveAsset_(leadPid, "PROJECT_FOLDER", restoredDrive, extractDriveIdFromUrl_(restoredDrive), "", "Leads");
        changed = true;
        repairedDrive++;
      }
    }

    if (changed) repaired++;
  }

  return { success: true, repaired: repaired, repairedDrive: repairedDrive };
}

function repairLeadsMissingPic(accessKey) {
  try {
    requireInternalRole_(accessKey);
    return repairLeadsMissingPic_();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function ensureDriveAssetsSheet_(ss) {
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var sheet = ss.getSheetByName(CONFIG.SHEET_DRIVE_ASSETS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_DRIVE_ASSETS);
    sheet.appendRow([
      "timestamp", "projectId", "assetType", "assetId", "assetUrl",
      "assetName", "sourceSheet", "isTrashed", "trashedAt", "notes"
    ]);
  }
  return sheet;
}

/** Skema kanonik tiap sheet — kolom di luar daftar ini dianggap tidak terpakai & dibuang. */
function getEnterpriseSheetSchemas_() {
  return [
    {
      name: CONFIG.SHEET_LEADS,
      headers: [
        "id", "client", "category", "status", "driveUrl", "timestamp", "pic", "notes", "email",
        "productionStage", "postProductionProgress", "productionUpdatedAt", "productionUpdatedBy", "productionNotes",
        "productionOpsData", "productionOpsUpdatedAt", "productionOpsUpdatedBy",
        "projectTotal", "totalMurid"
      ],
      colorKey: "status",
      colors: {
        "New Lead": { bg: "#DBEAFE", fg: "#1E3A8A" },
        "In Progress": { bg: "#FEF3C7", fg: "#92400E" },
        "Deal": { bg: "#DCFCE7", fg: "#166534" },
        "In-Production": { bg: "#EDE9FE", fg: "#5B21B6" },
        "Done": { bg: "#E0E7FF", fg: "#3730A3" },
        "On Hold": { bg: "#FEE2E2", fg: "#991B1B" },
        "Cancelled": { bg: "#F3F4F6", fg: "#4B5563" }
      },
      note: "Status project: New Lead, In Progress, Deal, In-Production, Done, On Hold, Cancelled"
    },
    {
      name: CONFIG.SHEET_CLIENTS,
      headers: [
        "timestamp", "brandName", "whatsapp", "email", "representativeType",
        "projectType", "budgetRange", "projectTotal", "pic", "totalMurid",
        "shootingDays", "shootingStartDate", "shootingEndDate", "shootingDateLabel",
        "briefNarrative",
        "emailOtpVerified", "agreementAccepted", "pdpPolicyVersion", "status", "projectId", "createdAt"
      ],
      colorKey: "status",
      colors: {
        "New Lead": { bg: "#DBEAFE", fg: "#1E3A8A" },
        "In Progress": { bg: "#FEF3C7", fg: "#92400E" },
        "Deal": { bg: "#DCFCE7", fg: "#166534" },
        "Submitted": { bg: "#DBEAFE", fg: "#1E3A8A" },
        "Verified": { bg: "#DCFCE7", fg: "#166534" }
      },
      note: "Intake klien dari Booking Now. Kolom lama (deadline/mood) dibuang otomatis."
    },
    {
      name: "StatusHistory",
      headers: ["timestamp", "projectId", "oldStatus", "newStatus", "notes", "changedBy"],
      colorKey: "newStatus",
      colors: {
        "New Lead": { bg: "#DBEAFE", fg: "#1E3A8A" },
        "In Progress": { bg: "#FEF3C7", fg: "#92400E" },
        "Deal": { bg: "#DCFCE7", fg: "#166534" },
        "In-Production": { bg: "#EDE9FE", fg: "#5B21B6" },
        "Done": { bg: "#E0E7FF", fg: "#3730A3" },
        "On Hold": { bg: "#FEE2E2", fg: "#991B1B" },
        "Cancelled": { bg: "#F3F4F6", fg: "#4B5563" }
      }
    },
    {
      name: CONFIG.SHEET_PROD_HIST,
      headers: ["timestamp", "projectId", "oldStage", "newStage", "oldProgress", "newProgress", "notes", "updatedBy"],
      colorKey: "newStage",
      colors: {
        "On Discuss": { bg: "#DBEAFE", fg: "#1E3A8A" },
        "Production/Shooting": { bg: "#FEF3C7", fg: "#92400E" },
        "Post Production": { bg: "#EDE9FE", fg: "#5B21B6" },
        "Project Selesai": { bg: "#DCFCE7", fg: "#166534" }
      }
    },
    {
      name: CONFIG.SHEET_DRIVE_ASSETS,
      headers: [
        "timestamp", "projectId", "assetType", "assetId", "assetUrl",
        "assetName", "sourceSheet", "isTrashed", "trashedAt", "notes"
      ],
      colorKey: "assetType",
      colors: {
        "PROJECT_FOLDER": { bg: "#DBEAFE", fg: "#1E3A8A" },
        "DEPT_FOLDER": { bg: "#E0E7FF", fg: "#3730A3" },
        "INVOICE_PDF": { bg: "#F3E8FF", fg: "#6B21A8" },
        "TRANSFER_PROOF": { bg: "#DCFCE7", fg: "#166534" }
      },
      note: "PROJECT_FOLDER (biru) · DEPT_FOLDER (indigo) · INVOICE_PDF (ungu) · TRANSFER_PROOF (hijau)"
    },
    {
      name: CONFIG.SHEET_USERS,
      headers: ["email", "name", "role", "password", "isActive", "createdAt"],
      colorKey: "role",
      colors: {
        "DIRECTOR": { bg: "#F3E8FF", fg: "#6B21A8" },
        "OFFICER": { bg: "#DBEAFE", fg: "#1E3A8A" },
        "INTERNAL": { bg: "#E0E7FF", fg: "#3730A3" },
        "MARKETING": { bg: "#DCFCE7", fg: "#166534" },
        "SOUND_MAN": { bg: "#FFEDD5", fg: "#9A3412" },
        "EDITOR": { bg: "#E0E7FF", fg: "#3730A3" },
        "FINAL_VIDEO": { bg: "#E0E7FF", fg: "#3730A3" }
      },
      note: "Akun tim internal FA. Client ada di sheet ClientUsers. Kolom password berisi hash — jangan diubah manual."
    },
    {
      name: CONFIG.SHEET_CLIENT_USERS,
      headers: ["email", "name", "password", "isActive", "createdAt", "pdpConsent", "pdpConsentAt", "pdpPolicyVersion"],
      colorKey: "isActive",
      colors: {
        "TRUE": { bg: "#DCFCE7", fg: "#166534" },
        "FALSE": { bg: "#FEE2E2", fg: "#991B1B" }
      },
      note: "Akun client (Sign Up publik). Kolom pdpConsent/pdpConsentAt/pdpPolicyVersion adalah bukti persetujuan UU PDP."
    },
    {
      name: CONFIG.SHEET_PAYMENTS,
      headers: [
        "paymentId", "projectId", "clientName", "clientEmail",
        "amount", "lastAmount", "projectTotal", "remainingAmount", "paymentMethod", "paymentDate", "proofUrl",
        "bankReference", "notes", "paymentStatus",
        "validatedAt", "validatedBy", "invoiceNumber",
        "invoiceUrl", "invoiceSentAt", "createdAt"
      ],
      colorKey: "paymentStatus",
      colors: {
        "Pending": { bg: "#FEF3C7", fg: "#92400E" },
        "Waiting Approval": { bg: "#FFEDD5", fg: "#9A3412" },
        "Validated": { bg: "#DCFCE7", fg: "#166534" },
        "Rejected": { bg: "#FEE2E2", fg: "#991B1B" },
        "Partial": { bg: "#DBEAFE", fg: "#1E3A8A" },
        "Paid": { bg: "#DCFCE7", fg: "#166534" },
        "Cancelled": { bg: "#F3F4F6", fg: "#4B5563" }
      }
    },
    {
      name: CONFIG.SHEET_PAY_INVOICES,
      headers: [
        "timestamp", "projectId", "paymentId", "invoiceNumber",
        "amount", "totalPaid", "projectTotal", "remainingAmount", "paymentMethod", "paymentDate",
        "bankReference", "invoiceUrl", "proofUrl", "validatedBy", "notes"
      ]
    },
    {
      name: CONFIG.SHEET_PAY_HIST,
      headers: ["timestamp", "paymentId", "oldStatus", "newStatus", "changedBy", "notes"],
      colorKey: "newStatus",
      colors: {
        "Pending": { bg: "#FEF3C7", fg: "#92400E" },
        "Waiting Approval": { bg: "#FFEDD5", fg: "#9A3412" },
        "Validated": { bg: "#DCFCE7", fg: "#166534" },
        "Rejected": { bg: "#FEE2E2", fg: "#991B1B" },
        "Partial": { bg: "#DBEAFE", fg: "#1E3A8A" },
        "Paid": { bg: "#DCFCE7", fg: "#166534" },
        "Cancelled": { bg: "#F3F4F6", fg: "#4B5563" }
      }
    },
    {
      name: CONFIG.SHEET_PAY_APPROVALS,
      headers: [
        "approvalId", "projectId", "paymentId", "clientName", "clientEmail",
        "amount", "projectTotal", "paymentMethod", "paymentDate", "notes",
        "proofUrl", "proofFileName", "proofFileId",
        "requestedPaymentStatus",
        "status", "submittedBy", "submittedAt",
        "reviewedBy", "reviewedAt", "reviewNotes"
      ],
      colorKey: "status",
      colors: {
        "Pending": { bg: "#FEF3C7", fg: "#92400E" },
        "Approved": { bg: "#DCFCE7", fg: "#166534" },
        "Rejected": { bg: "#FEE2E2", fg: "#991B1B" }
      }
    }
  ];
}

function colIndexToLetter_(col) {
  var n = Number(col) || 0;
  var s = "";
  while (n > 0) {
    var m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s || "A";
}

function clearSheetConditionalRules_(sheet) {
  try { sheet.setConditionalFormatRules([]); } catch (e) {}
}

function pruneSheetToSchema_(sheet, schemaHeaders) {
  if (!sheet || !schemaHeaders || !schemaHeaders.length) return { removed: [], kept: 0 };
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    sheet.getRange(1, 1, 1, schemaHeaders.length).setValues([schemaHeaders]);
    return { removed: [], kept: schemaHeaders.length };
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || "").trim();
  });
  var keepLower = {};
  schemaHeaders.forEach(function(h) { keepLower[String(h).toLowerCase()] = true; });

  var removed = [];
  // Hapus dari kanan ke kiri supaya index kolom tidak bergeser salah
  for (var c = headers.length; c >= 1; c--) {
    var name = headers[c - 1];
    var key = String(name || "").trim().toLowerCase();
    if (!key || !keepLower[key]) {
      removed.push(name || ("(kosong col " + c + ")"));
      sheet.deleteColumn(c);
    }
  }

  // Pastikan semua header skema ada
  headers = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { return String(h || "").trim(); })
    : [];
  var lower = headers.map(function(h) { return h.toLowerCase(); });
  schemaHeaders.forEach(function(header) {
    if (lower.indexOf(header.toLowerCase()) < 0) {
      var newCol = Math.max(sheet.getLastColumn(), 0) + 1;
      sheet.getRange(1, newCol).setValue(header);
      headers.push(header);
      lower.push(header.toLowerCase());
    }
  });

  return { removed: removed, kept: headers.length };
}

function removeEmptySheetRows_(sheet) {
  if (!sheet) return 0;
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return 0;
  var values = sheet.getRange(2, 1, lastRow, lastCol).getValues();
  var removed = 0;
  for (var i = values.length - 1; i >= 0; i--) {
    var empty = values[i].every(function(cell) {
      return cell === "" || cell === null || cell === undefined;
    });
    if (empty) {
      sheet.deleteRow(i + 2);
      removed++;
    }
  }
  return removed;
}

function styleEnterpriseSheet_(sheet, schema) {
  if (!sheet) return;
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var formatRows = Math.max(lastRow, 200);

  sheet.setFrozenRows(1);
  clearSheetConditionalRules_(sheet);

  var header = sheet.getRange(1, 1, 1, lastCol);
  header.setFontWeight("bold");
  header.setBackground("#111827");
  header.setFontColor("#F9FAFB");
  header.setWrap(true);
  if (schema && schema.note) {
    sheet.getRange(1, 1).setNote(schema.note);
  }

  // Body base style
  if (lastRow >= 2) {
    var body = sheet.getRange(2, 1, lastRow, lastCol);
    body.setBackground("#FFFFFF");
    body.setFontColor("#111827");
    body.setVerticalAlignment("middle");
  }

  try {
    if (sheet.getFilter()) sheet.getFilter().remove();
  } catch (e1) {}
  if (lastRow > 1) {
    try { sheet.getRange(1, 1, lastRow, lastCol).createFilter(); } catch (e2) {}
  }

  try { sheet.autoResizeColumns(1, lastCol); } catch (e3) {}

  if (!schema || !schema.colorKey || !schema.colors) return;

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || "").trim().toLowerCase();
  });
  var keyIdx = headers.indexOf(String(schema.colorKey).toLowerCase());
  if (keyIdx < 0) return;
  var colLetter = colIndexToLetter_(keyIdx + 1);
  var range = sheet.getRange(2, 1, formatRows, lastCol);
  var rules = [];
  Object.keys(schema.colors).forEach(function(value) {
    var style = schema.colors[value];
    var safe = String(value).replace(/"/g, '""');
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied("=$" + colLetter + "2=\"" + safe + "\"")
        .setBackground(style.bg)
        .setFontColor(style.fg)
        .setRanges([range])
        .build()
    );
  });
  sheet.setConditionalFormatRules(rules);
  sheet.getRange(2, keyIdx + 1, formatRows, 1).setFontWeight("bold");
}

function deleteUnusedEnterpriseSheets_(ss, keepNames) {
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var keep = {};
  (keepNames || []).forEach(function(n) { keep[String(n).toLowerCase()] = true; });
  var deleted = [];
  var sheets = ss.getSheets();
  // Jangan hapus sheet terakhir di workbook
  if (sheets.length <= 1) return deleted;

  sheets.forEach(function(sheet) {
    var name = sheet.getName();
    if (keep[String(name).toLowerCase()]) return;
    // Hapus sheet default kosong / orphan yang tidak ada di logic
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var isBlank = lastRow <= 1 && (lastCol <= 1);
    var looksDefault = /^sheet\d+$/i.test(name) || /^untitled/i.test(name);
    if (isBlank || looksDefault) {
      try {
        if (ss.getSheets().length > 1) {
          ss.deleteSheet(sheet);
          deleted.push(name);
        }
      } catch (e) {
        Logger.log("Gagal hapus sheet " + name + ": " + e.message);
      }
    }
  });
  return deleted;
}

/**
 * Rapikan semua sheet enterprise: buang kolom orphan, baris kosong,
 * hapus sheet default tidak terpakai, lalu warnai + filter.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet=} ss
 * @param {{skipInit?: boolean}=} opts
 */
function tidyEnterpriseSpreadsheet_(ss, opts) {
  opts = opts || {};
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  if (!opts.skipInit) {
    _SKIP_AUTO_TIDY = true;
    try {
      initializeGoogleSheets_(ss);
      initializePaymentSheets_();
    } finally {
      _SKIP_AUTO_TIDY = false;
    }
  }

  var schemas = getEnterpriseSheetSchemas_();
  var keepNames = schemas.map(function(s) { return s.name; });
  var summary = {
    sheets: [],
    deletedSheets: deleteUnusedEnterpriseSheets_(ss, keepNames),
    removedColumns: 0,
    removedRows: 0
  };

  schemas.forEach(function(schema) {
    var sheet = ss.getSheetByName(schema.name);
    if (!sheet) return;
    var prune = pruneSheetToSchema_(sheet, schema.headers);
    var rowsRemoved = removeEmptySheetRows_(sheet);
    styleEnterpriseSheet_(sheet, schema);
    summary.removedColumns += prune.removed.length;
    summary.removedRows += rowsRemoved;
    summary.sheets.push({
      name: schema.name,
      removedColumns: prune.removed,
      removedRows: rowsRemoved
    });
  });

  return summary;
}

/** Auto-tidy sekali setelah deploy (dipanggil dari init payment sheets). */
function maybeAutoTidySheets_(ss) {
  if (_SKIP_AUTO_TIDY) return;
  try { ensureClientUsersSheet_(ss); } catch (e) {}
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty("SHEETS_TIDY_V53") === "DONE") return;
  try {
    props.setProperty("SHEETS_TIDY_V53", "RUNNING");
    tidyEnterpriseSpreadsheet_(ss, { skipInit: true });
    props.setProperty("SHEETS_TIDY_V53", "DONE");
  } catch (err) {
    props.deleteProperty("SHEETS_TIDY_V53");
    Logger.log("maybeAutoTidySheets_ gagal: " + err.message);
  }
}

/** Public: rapikan + warnai semua sheet (butuh login internal). */
function tidyEnterpriseSpreadsheet(accessKey) {
  try {
    requireInternalRole_(accessKey);
    var summary = tidyEnterpriseSpreadsheet_();
    return {
      success: true,
      message: "Sheets dirapikan: " + summary.removedColumns + " kolom orphan dibuang, " +
        summary.removedRows + " baris kosong dihapus, " +
        (summary.deletedSheets.length ? summary.deletedSheets.join(", ") + " dihapus." : "formatting diterapkan."),
      summary: summary
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** Alias lama — hanya refresh styling DriveAssets (tanpa prune global). */
function formatDriveAssetsSheet(accessKey) {
  try {
    requireInternalRole_(accessKey);
    var sheet = ensureDriveAssetsSheet_();
    applyDriveAssetsSheetStyle_(sheet);
    return {
      success: true,
      message: "DriveAssets sudah diwarnai: Folder (biru), Invoice (ungu), Bukti Transfer (hijau)."
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function applyDriveAssetsSheetStyle_(sheet) {
  var schemas = getEnterpriseSheetSchemas_();
  for (var i = 0; i < schemas.length; i++) {
    if (schemas[i].name === CONFIG.SHEET_DRIVE_ASSETS) {
      styleEnterpriseSheet_(sheet, schemas[i]);
      return;
    }
  }
}

function logDriveAsset_(projectId, assetType, assetUrl, assetId, assetName, sourceSheet) {
  try {
    if (!assetUrl && !assetId) return;
    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var sheet = ensureDriveAssetsSheet_(ss);
    var resolvedId = assetId || extractDriveIdFromUrl_(assetUrl);
    if (!resolvedId) return;

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][3]) === String(resolvedId)) return;
    }

    sheet.appendRow([
      new Date().toLocaleString("id-ID"),
      normalizeProjectId_(projectId),
      assetType || "",
      resolvedId,
      assetUrl || "",
      sanitizeSheetCell_(assetName || ""),
      sourceSheet || "",
      "FALSE",
      "",
      ""
    ]);
    _OPS_FOLDER_CATALOG_CACHE = null; // katalog berubah, buang cache
  } catch (e) {
    Logger.log("Log Drive asset gagal: " + e.message);
  }
}

function cleanupDeletedSheetAssets_() {
  try {
    initializeGoogleSheets_();
    initializePaymentSheets_();
    syncDriveAssetIndexFromSheets_();

    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var assetSheet = ensureDriveAssetsSheet_(ss);
    var assetData = assetSheet.getDataRange().getValues();
    if (assetData.length <= 1) {
      return { success: true, trashed: 0, message: "Belum ada asset Drive yang terindex." };
    }

    var activeProjects = getActiveProjectIds_(ss);
    var invoiceUrls = getActiveAssetUrlsFromSheet_(ss.getSheetByName(CONFIG.SHEET_PAY_INVOICES), ["invoiceurl"]);
    var proofUrls = getActiveAssetUrlsFromSheet_(ss.getSheetByName(CONFIG.SHEET_PAY_INVOICES), ["proofurl"]);
    var paymentInvoiceUrls = getActiveAssetUrlsFromSheet_(ss.getSheetByName(CONFIG.SHEET_PAYMENTS), ["invoiceurl"]);
    var paymentProofUrls = getActiveAssetUrlsFromSheet_(ss.getSheetByName(CONFIG.SHEET_PAYMENTS), ["proofurl"]);

    var trashed = 0;
    for (var r = 1; r < assetData.length; r++) {
      var projectId = normalizeProjectId_(assetData[r][1]);
      var assetType = String(assetData[r][2] || "").trim();
      var assetId = String(assetData[r][3] || "").trim();
      var assetUrl = String(assetData[r][4] || "").trim();
      var sourceSheet = String(assetData[r][6] || "").trim();
      var isTrashed = String(assetData[r][7] || "").trim().toUpperCase() === "TRUE";
      if (isTrashed || !assetId) continue;

      var shouldTrash = false;
      if (assetType === "PROJECT_FOLDER") {
        shouldTrash = projectId && !activeProjects[projectId];
      } else if (assetType === "INVOICE_PDF") {
        var activeInvoiceSource = sourceSheet === "Payments" ? paymentInvoiceUrls : invoiceUrls;
        shouldTrash = (projectId && !activeProjects[projectId]) || (assetUrl && !activeInvoiceSource[assetUrl]);
      } else if (assetType === "TRANSFER_PROOF") {
        var activeProofSource = sourceSheet === "Payments" ? paymentProofUrls : proofUrls;
        shouldTrash = (projectId && !activeProjects[projectId]) || (assetUrl && !activeProofSource[assetUrl]);
      }

      if (shouldTrash && trashDriveAssetById_(assetId, assetType)) {
        assetSheet.getRange(r + 1, 8).setValue("TRUE");
        assetSheet.getRange(r + 1, 9).setValue(new Date().toLocaleString("id-ID"));
        assetSheet.getRange(r + 1, 10).setValue("Auto trash: row database terkait sudah tidak aktif.");
        trashed++;
      }
    }

    return { success: true, trashed: trashed, message: trashed + " asset Drive dipindahkan ke trash." };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function cleanupDeletedSheetAssets(accessKey) {
  try {
    requireInternalRole_(accessKey);
    return cleanupDeletedSheetAssets_();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function syncDriveAssetIndexFromSheets_() {
  var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var leads = ss.getSheetByName(CONFIG.SHEET_LEADS);
  if (leads) {
    var leadRows = getRowsByHeader_(leads);
    leadRows.forEach(function(row) {
      if (row.driveurl) {
        logDriveAsset_(row.id, "PROJECT_FOLDER", row.driveurl, extractDriveIdFromUrl_(row.driveurl), row.client || "", "Leads");
      }
    });
  }

  var invoices = ss.getSheetByName(CONFIG.SHEET_PAY_INVOICES);
  if (invoices) {
    getRowsByHeader_(invoices).forEach(function(row) {
      if (row.invoiceurl) {
        logDriveAsset_(row.projectid, "INVOICE_PDF", row.invoiceurl, extractDriveIdFromUrl_(row.invoiceurl), row.invoicenumber || "", "PaymentInvoices");
      }
      if (row.proofurl) {
        logDriveAsset_(row.projectid, "TRANSFER_PROOF", row.proofurl, extractDriveIdFromUrl_(row.proofurl), "Bukti Transfer", "PaymentInvoices");
      }
    });
  }

  var payments = ss.getSheetByName(CONFIG.SHEET_PAYMENTS);
  if (payments) {
    getRowsByHeader_(payments).forEach(function(row) {
      if (row.invoiceurl) {
        logDriveAsset_(row.projectid, "INVOICE_PDF", row.invoiceurl, extractDriveIdFromUrl_(row.invoiceurl), row.invoicenumber || "", "Payments");
      }
      if (row.proofurl) {
        logDriveAsset_(row.projectid, "TRANSFER_PROOF", row.proofurl, extractDriveIdFromUrl_(row.proofurl), "Bukti Transfer", "Payments");
      }
    });
  }
}

function setupDriveCleanupTrigger(accessKey) {
  try {
    requireInternalRole_(accessKey);
  } catch (err) {
    return { success: false, error: err.message };
  }
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "cleanupDeletedSheetAssets_") {
      return { success: true, message: "Trigger cleanup Drive sudah aktif." };
    }
    if (triggers[i].getHandlerFunction() === "cleanupDeletedSheetAssets") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger("cleanupDeletedSheetAssets_")
    .forSpreadsheet(SpreadsheetApp.openById(getConfig_("SHEET_ID")))
    .onChange()
    .create();

  return { success: true, message: "Trigger cleanup Drive berhasil dibuat." };
}

function getActiveProjectIds_(ss) {
  var active = {};
  var leads = ss.getSheetByName(CONFIG.SHEET_LEADS);
  if (leads) {
    getRowsByHeader_(leads).forEach(function(row) {
      var id = normalizeProjectId_(row.id);
      if (id) active[id] = true;
    });
  }

  var clients = ss.getSheetByName(CONFIG.SHEET_CLIENTS);
  if (clients) {
    getRowsByHeader_(clients).forEach(function(row) {
      var id = normalizeProjectId_(row.projectid);
      if (id) active[id] = true;
    });
  }

  return active;
}

function getActiveAssetUrlsFromSheet_(sheet, keys) {
  var urls = {};
  if (!sheet) return urls;
  getRowsByHeader_(sheet).forEach(function(row) {
    keys.forEach(function(key) {
      if (row[key]) urls[String(row[key]).trim()] = true;
    });
  });
  return urls;
}

function getRowsByHeader_(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0].map(function(h) {
    return String(h || "").trim().toLowerCase();
  });

  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      obj[h] = row[i];
    });
    return obj;
  });
}

function trashDriveAssetById_(assetId, assetType) {
  try {
    if (assetType === "PROJECT_FOLDER") {
      DriveApp.getFolderById(assetId).setTrashed(true);
    } else {
      DriveApp.getFileById(assetId).setTrashed(true);
    }
    return true;
  } catch (e) {
    Logger.log("Trash Drive asset gagal (" + assetId + "): " + e.message);
    return false;
  }
}

function extractDriveIdFromUrl_(url) {
  url = String(url || "");
  var folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];
  var fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];
  var idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return "";
}

function normalizeProjectId_(projectId) {
  var id = String(projectId || "").trim();
  if (!id) return "";
  return id.charAt(0) === "#" ? id : "#" + id;
}

function migratePaymentSheetColumns_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf("lastAmount") < 0) {
    var amountCol = headers.indexOf("amount");
    var insertAt = amountCol >= 0 ? amountCol + 2 : headers.length + 1;
    sheet.insertColumnAfter(amountCol >= 0 ? amountCol + 1 : headers.length);
    sheet.getRange(1, insertAt).setValue("lastAmount");
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  ["projectTotal", "remainingAmount"].forEach(function(header) {
    if (headers.indexOf(header) < 0) {
      sheet.insertColumnAfter(sheet.getLastColumn());
      sheet.getRange(1, sheet.getLastColumn()).setValue(header);
      headers.push(header);
    }
  });
}

function migratePaymentInvoiceSheetColumns_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf("proofUrl") < 0) {
    var invoiceUrlCol = headers.indexOf("invoiceUrl");
    sheet.insertColumnAfter(invoiceUrlCol >= 0 ? invoiceUrlCol + 1 : headers.length);
    sheet.getRange(1, (invoiceUrlCol >= 0 ? invoiceUrlCol + 2 : headers.length + 1)).setValue("proofUrl");
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  ["projectTotal", "remainingAmount"].forEach(function(header) {
    if (headers.indexOf(header) < 0) {
      sheet.insertColumnAfter(sheet.getLastColumn());
      sheet.getRange(1, sheet.getLastColumn()).setValue(header);
      headers.push(header);
    }
  });
}

function logPaymentInvoice_(data) {
  initializePaymentSheets_();
  var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var sheet = ss.getSheetByName(CONFIG.SHEET_PAY_INVOICES);
  var headers = sheet.getDataRange().getValues()[0];
  var rowData = {
    timestamp: new Date().toLocaleString("id-ID"),
    projectId: data.projectId,
    paymentId: data.paymentId,
    invoiceNumber: data.invoiceNumber,
    amount: Number(data.amount),
    totalPaid: Number(data.totalPaid),
    projectTotal: data.projectTotal ? Number(data.projectTotal) : "",
    remainingAmount: data.remainingAmount !== "" && data.remainingAmount != null ? Number(data.remainingAmount) : "",
    paymentMethod: data.paymentMethod || "",
    paymentDate: data.paymentDate || "",
    bankReference: data.bankReference || "",
    invoiceUrl: data.invoiceUrl || "",
    proofUrl: data.proofUrl || "",
    validatedBy: data.validatedBy || "",
    notes: data.notes || ""
  };
  sheet.appendRow(headers.map(function(header) {
    return rowData[header] !== undefined ? rowData[header] : "";
  }));
}

// Agregasi invoice per project (sumber kebenaran untuk total tervalidasi).
function getInvoiceAggMap_(preloadedValues) {
  var map = {};
  var data = preloadedValues;
  if (!data) {
    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var sheet = ss.getSheetByName(CONFIG.SHEET_PAY_INVOICES);
    if (!sheet || sheet.getLastRow() <= 1) return map;
    data = sheet.getDataRange().getValues();
  }
  if (!data || data.length <= 1) return map;

  var headers = data[0];
  var projectCol = headers.indexOf("projectId");
  var amountCol = headers.indexOf("amount");
  var invoiceCol = headers.indexOf("invoiceNumber");
  var methodCol = headers.indexOf("paymentMethod");
  var dateCol = headers.indexOf("paymentDate");
  var urlCol = headers.indexOf("invoiceUrl");
  var validatedCol = headers.indexOf("timestamp");
  if (projectCol < 0 || amountCol < 0) return map;

  for (var i = 1; i < data.length; i++) {
    var pid = normalizeProjectId_(data[i][projectCol]);
    if (!pid) continue;
    var amount = Number(data[i][amountCol]) || 0;
    var entry = map[pid] || {
      total: 0,
      count: 0,
      lastAmount: "",
      lastInvoiceNumber: "",
      lastPaymentMethod: "",
      lastPaymentDate: "",
      lastInvoiceUrl: "",
      lastValidatedAt: ""
    };
    entry.total += amount;
    entry.count += 1;
    entry.lastAmount = amount;
    if (invoiceCol >= 0) entry.lastInvoiceNumber = String(data[i][invoiceCol] || "");
    if (methodCol >= 0) entry.lastPaymentMethod = String(data[i][methodCol] || "");
    if (dateCol >= 0) entry.lastPaymentDate = data[i][dateCol] || "";
    if (urlCol >= 0) entry.lastInvoiceUrl = String(data[i][urlCol] || "");
    if (validatedCol >= 0) entry.lastValidatedAt = data[i][validatedCol] || "";
    map[pid] = entry;
  }
  return map;
}

function getTotalPaidForProject_(projectId) {
  initializePaymentSheets_();
  projectId = normalizeProjectId_(projectId);
  var agg = getInvoiceAggMap_()[projectId];
  var invoiceTotal = agg ? Number(agg.total || 0) : 0;
  if (invoiceTotal > 0) return invoiceTotal;

  var paymentsMap = getPaymentsMapByProject_();
  return Number((paymentsMap[projectId] || {}).amount || 0);
}

// Hitung jumlah invoice per project dalam satu kali baca sheet (hindari N+1).
function getInvoiceCountMap_() {
  var agg = getInvoiceAggMap_();
  var map = {};
  Object.keys(agg).forEach(function(pid) {
    map[pid] = agg[pid].count || 0;
  });
  return map;
}

function getInvoiceCountForProject_(projectId) {
  projectId = normalizeProjectId_(projectId);
  var agg = getInvoiceAggMap_()[projectId];
  return agg ? Number(agg.count || 0) : 0;
}

function getPaymentsMapByProject_(preloadedValues) {
  var map = {};
  var data = preloadedValues;
  if (!data) {
    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var sheet = ss.getSheetByName(CONFIG.SHEET_PAYMENTS);
    if (!sheet) return map;
    data = sheet.getDataRange().getValues();
  }
  if (!data || data.length <= 1) return map;

  var headers = data[0];
  var projectCol = headers.indexOf("projectId");
  var amountCol = headers.indexOf("amount");

  for (var i = 1; i < data.length; i++) {
    var obj = {};
    headers.forEach(function(h, idx) { obj[h] = data[i][idx]; });
    var pid = projectCol >= 0 ? normalizeProjectId_(data[i][projectCol]) : "";
    if (!pid) continue;
    // Jika ada duplikat row (beda format ID), pilih yang amount-nya lebih besar / lebih lengkap
    var prev = map[pid];
    if (!prev) {
      map[pid] = obj;
      continue;
    }
    var prevAmount = Number(prev.amount || 0);
    var nextAmount = Number(amountCol >= 0 ? data[i][amountCol] : obj.amount || 0);
    if (nextAmount >= prevAmount) map[pid] = obj;
  }
  return map;
}

function getLeadByProjectId_(projectId) {
  var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var sheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var headerMap = getHeaderIndexMap_(headers);
  var idIdx = headerMap.id !== undefined ? headerMap.id : 0;

  for (var i = 1; i < data.length; i++) {
    if (normalizeProjectId_(data[i][idIdx]) === normalizeProjectId_(projectId)) {
      var clientEmail = resolveClientEmail_(projectId, data[i], headers);
      var driveByProject = getProjectDriveUrlMap_(ss);
      var leadPid = normalizeProjectId_(projectId);
      var driveUrl = getRowValueByHeader_(data[i], headerMap, ["driveurl"], data[i][4]);
      if (!String(driveUrl || "").trim()) {
        driveUrl = driveByProject[leadPid] || findDriveUrlInLeadRow_(data[i], headerMap);
      }
      return {
        projectId: data[i][idIdx],
        clientName: getRowValueByHeader_(data[i], headerMap, ["client", "brandname"], data[i][1]),
        category: getRowValueByHeader_(data[i], headerMap, ["category", "projecttype"], data[i][2]),
        status: getRowValueByHeader_(data[i], headerMap, ["status"], data[i][3]),
        driveUrl: driveUrl,
        timestamp: formatCellValue_(getRowValueByHeader_(data[i], headerMap, ["timestamp"], data[i][5])),
        pic: getRowValueByHeader_(data[i], headerMap, ["pic"], data[i][6]),
        notes: getRowValueByHeader_(data[i], headerMap, ["notes"], data[i][7]),
        clientEmail: clientEmail,
        productionStage: getCellByHeader_(data[i], headers, "productionStage"),
        postProductionProgress: getCellByHeader_(data[i], headers, "postProductionProgress"),
        productionUpdatedAt: getCellByHeader_(data[i], headers, "productionUpdatedAt"),
        productionUpdatedBy: getCellByHeader_(data[i], headers, "productionUpdatedBy"),
        productionNotes: getCellByHeader_(data[i], headers, "productionNotes"),
        productionOpsData: getCellByHeader_(data[i], headers, "productionOpsData"),
        productionOpsUpdatedAt: getCellByHeader_(data[i], headers, "productionOpsUpdatedAt"),
        productionOpsUpdatedBy: getCellByHeader_(data[i], headers, "productionOpsUpdatedBy"),
        projectTotal: parseProjectTotal_(getCellByHeader_(data[i], headers, "projectTotal")),
        totalMurid: getCellByHeader_(data[i], headers, "totalMurid"),
        shootingDays: getCellByHeader_(data[i], headers, "shootingDays"),
        shootingStartDate: toShootingIsoDate_(getCellByHeader_(data[i], headers, "shootingStartDate")),
        shootingEndDate: toShootingIsoDate_(getCellByHeader_(data[i], headers, "shootingEndDate")),
        shootingDateLabel: getCellByHeader_(data[i], headers, "shootingDateLabel"),
        shootingReleasedAt: getCellByHeader_(data[i], headers, "shootingReleasedAt")
      };
    }
  }
  return null;
}

function listLeadsByClientEmail_(email) {
  email = String(email || "").trim().toLowerCase();
  if (!email) return [];
  var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var ids = [];
  var seen = {};

  function addId(raw) {
    var pid = normalizeProjectId_(raw);
    if (!pid || seen[pid]) return;
    seen[pid] = true;
    ids.push(pid);
  }

  var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
  if (leadsSheet && leadsSheet.getLastRow() > 1) {
    var data = leadsSheet.getDataRange().getValues();
    var headers = data[0];
    var headerMap = getHeaderIndexMap_(headers);
    var idIdx = headerMap.id !== undefined ? headerMap.id : 0;
    for (var i = 1; i < data.length; i++) {
      var pid = data[i][idIdx];
      var clientEmail = String(resolveClientEmail_(pid, data[i], headers) || "").trim().toLowerCase();
      if (clientEmail === email) addId(pid);
    }
  }

  var intake = ss.getSheetByName(CONFIG.SHEET_CLIENTS);
  if (intake && intake.getLastRow() > 1) {
    var idata = intake.getDataRange().getValues();
    var imap = getHeaderIndexMap_(idata[0]);
    var emailCol = imap.email;
    var pidCol = imap.projectid;
    if (emailCol !== undefined && pidCol !== undefined) {
      for (var j = 1; j < idata.length; j++) {
        if (String(idata[j][emailCol] || "").trim().toLowerCase() === email) {
          addId(idata[j][pidCol]);
        }
      }
    }
  }

  var leads = [];
  for (var k = 0; k < ids.length; k++) {
    var lead = getLeadByProjectId_(ids[k]);
    if (lead) leads.push(lead);
  }
  return leads;
}

function getEmailFromClientIntake_(projectId) {
  try {
    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var sheet = ss.getSheetByName(CONFIG.SHEET_CLIENTS);
    if (!sheet) return "";
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return "";
    var headers = data[0].map(function(h) { return String(h || "").trim(); });
    var headerMap = getHeaderIndexMap_(headers);
    var pidCol = headerMap.projectid;
    var emailCol = headerMap.email;
    if (pidCol === undefined || emailCol === undefined) return "";
    var normTarget = normalizeProjectId_(projectId);
    for (var i = 1; i < data.length; i++) {
      if (normalizeProjectId_(data[i][pidCol]) === normTarget) {
        var email = String(data[i][emailCol] || "").trim();
        return isValidEmail_(email) ? email : "";
      }
    }
    return "";
  } catch (e) {
    return "";
  }
}

function formatCellValue_(v) {
  if (v === null || v === undefined || v === "") return "";
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "dd MMM yyyy");
  }
  return String(v);
}

function getCellByHeader_(row, headers, header) {
  var target = String(header || "").trim().toLowerCase();
  for (var i = 0; i < (headers || []).length; i++) {
    if (String(headers[i] || "").trim().toLowerCase() === target) {
      return row[i];
    }
  }
  return "";
}

function normalizeDriveEmail_(email) {
  return String(email || "").trim().toLowerCase();
}

function folderHasEditor_(folder, email) {
  email = normalizeDriveEmail_(email);
  if (!email || !folder) return false;
  try {
    var editors = folder.getEditors();
    for (var i = 0; i < editors.length; i++) {
      if (normalizeDriveEmail_(editors[i].getEmail()) === email) return true;
    }
  } catch (e) {}
  return false;
}

function folderHasViewer_(folder, email) {
  email = normalizeDriveEmail_(email);
  if (!email || !folder) return false;
  try {
    var viewers = folder.getViewers();
    for (var j = 0; j < viewers.length; j++) {
      if (normalizeDriveEmail_(viewers[j].getEmail()) === email) return true;
    }
  } catch (e) {}
  return false;
}

function addFolderEditorIfNeeded_(folder, email) {
  email = normalizeDriveEmail_(email);
  if (!isValidEmail_(email) || !folder) return false;
  if (folderHasEditor_(folder, email)) return false;
  try {
    if (folderHasViewer_(folder, email)) {
      try { folder.removeViewer(email); } catch (eRem) {}
    }
    folder.addEditor(email);
    appendAuditLog_("system", "DRIVE_ADD_EDITOR", email, "folder=" + (folder.getId ? folder.getId() : ""), "OK");
    return true;
  } catch (e) {
    Logger.log("addFolderEditorIfNeeded_ gagal " + email + ": " + e.message);
    return false;
  }
}

function addFolderViewerIfNeeded_(folder, email) {
  email = normalizeDriveEmail_(email);
  if (!isValidEmail_(email) || !folder) return false;
  if (folderHasViewer_(folder, email) || folderHasEditor_(folder, email)) return false;
  try {
    folder.addViewer(email);
    appendAuditLog_("system", "DRIVE_ADD_VIEWER", email, "folder=" + (folder.getId ? folder.getId() : ""), "OK");
    return true;
  } catch (e) {
    Logger.log("addFolderViewerIfNeeded_ gagal " + email + ": " + e.message);
    return false;
  }
}

function revokeFolderClientAccessIfNeeded_(folder, email) {
  email = normalizeDriveEmail_(email);
  if (!isValidEmail_(email) || !folder) return;
  var changed = false;
  if (folderHasEditor_(folder, email)) {
    try { folder.removeEditor(email); changed = true; } catch (e) {}
  }
  if (folderHasViewer_(folder, email)) {
    try { folder.removeViewer(email); changed = true; } catch (e) {}
  }
  if (changed) {
    appendAuditLog_("system", "DRIVE_REVOKE_CLIENT", email, "folder=" + (folder.getId ? folder.getId() : ""), "OK");
  }
}

function getInternalDriveEmails_() {
  var emails = {};
  var owner = String(CONFIG.EMAIL_FROM || "").trim().toLowerCase();
  if (isValidEmail_(owner)) emails[owner] = true;
  try {
    var sheet = ensureUsersSheet_();
    if (sheet && sheet.getLastRow() > 1) {
      var data = sheet.getDataRange().getValues();
      var headers = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
      var emailCol = headers.indexOf("email");
      var activeCol = headers.indexOf("isactive");
      if (emailCol < 0) emailCol = 0;
      for (var i = 1; i < data.length; i++) {
        var email = String(data[i][emailCol] || "").trim().toLowerCase();
        var isActive = activeCol < 0
          || data[i][activeCol] === true
          || String(data[i][activeCol] || "").trim().toUpperCase() === "TRUE";
        if (isActive && isValidEmail_(email)) emails[email] = true;
      }
    }
  } catch (e) {
    Logger.log("getInternalDriveEmails_ gagal: " + e.message);
  }
  return Object.keys(emails);
}

/**
 * Root DRIVE PORTAL: hanya tim internal.
 * Jangan share root ke klien — kalau klien bisa lihat root, mereka bisa lihat folder klien lain.
 */
function ensureDrivePortalRootAcl_() {
  try {
    var root = DriveApp.getFolderById(getConfig_("DRIVE_FOLDER_ID"));
    try {
      root.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    } catch (eShare) {
      Logger.log("ensureDrivePortalRootAcl_ setSharing: " + eShare.message);
    }
    getInternalDriveEmails_().forEach(function(email) {
      addFolderEditorIfNeeded_(root, email);
    });
  } catch (e) {
    Logger.log("ensureDrivePortalRootAcl_ gagal: " + e.message);
  }
}

/**
 * Isolasi akses folder project:
 * - folder privat (bukan "anyone with the link")
 * - tim internal (Users aktif + EMAIL_FROM) tetap editor
 * - klien = viewer hanya jika shareWithClient=true (setelah Production Ops 100% + payment Lunas)
 * Root DRIVE PORTAL tidak dibagikan ke klien → mereka tidak bisa lihat folder klien lain.
 */
function applyProjectFolderAcl_(folder, clientEmail, options) {
  options = options || {};
  var shareWithClient = options.shareWithClient === true;
  var result = {
    clientShared: false,
    clientRole: "",
    clientGated: !shareWithClient,
    internalShared: 0,
    internalSkipped: 0,
    privateOk: false,
    errors: []
  };
  if (!folder) {
    result.errors.push("Folder tidak ditemukan.");
    return result;
  }

  try {
    folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    result.privateOk = true;
  } catch (e) {
    result.errors.push("setSharing PRIVATE: " + e.message);
  }

  var client = normalizeDriveEmail_(clientEmail);
  if (isValidEmail_(client)) {
    if (shareWithClient) {
      if (folderHasEditor_(folder, client)) {
        result.clientShared = true;
        result.clientRole = "editor";
        result.clientGated = false;
      } else if (folderHasViewer_(folder, client)) {
        result.clientShared = true;
        result.clientRole = "viewer";
        result.clientGated = false;
      } else if (addFolderViewerIfNeeded_(folder, client)) {
        result.clientShared = true;
        result.clientRole = "viewer";
        result.clientGated = false;
      } else {
        try {
          if (addFolderEditorIfNeeded_(folder, client)) {
            result.clientShared = true;
            result.clientRole = "editor";
            result.clientGated = false;
            result.errors.push("client viewer gagal, fallback editor");
          }
        } catch (e3) {
          result.errors.push("share client: " + e3.message);
        }
      }
    } else {
      revokeFolderClientAccessIfNeeded_(folder, client);
      result.clientShared = false;
      result.clientRole = "gated";
      result.clientGated = true;
    }
  } else if (shareWithClient) {
    result.errors.push("Email klien tidak valid — folder belum di-share ke klien.");
  }

  getInternalDriveEmails_().forEach(function(email) {
    if (email === client) return;
    if (addFolderEditorIfNeeded_(folder, email)) {
      result.internalShared++;
    } else if (folderHasEditor_(folder, email)) {
      result.internalSkipped++;
    } else {
      result.errors.push("share internal " + email + ": gagal menambahkan editor");
    }
  });

  return result;
}

/** Production Ops siap untuk buka Drive: seluruh departemen tervalidasi / stage Project Selesai. */
function isProductionOpsCompleteForDrive_(lead, productionOps) {
  lead = lead || {};
  var ops = productionOps || buildClientProductionOpsReport_(lead);
  if (!ops || !Number(ops.totalCount || 0)) return false;
  if (normalizeProductionStage_(ops.stage) === "Project Selesai") return true;
  return Number(ops.overallPercent || 0) >= 100
    && Number(ops.doneCount || 0) === Number(ops.totalCount || 0)
    && Number(ops.totalCount || 0) > 0;
}

/** Payment siap untuk buka Drive: status Lunas (atau remaining 0 dengan total project). */
function isProjectPaymentLunas_(projectId, paymentHint) {
  var payment = paymentHint || null;
  if (!payment) {
    try {
      initializePaymentSheets_();
      var raw = getPaymentsMapByProject_();
      var invoiceAgg = getInvoiceAggMap_();
      var map = serializePaymentMap_(raw, null, invoiceAgg);
      var pid = normalizeProjectId_(projectId);
      payment = map[pid] || map[String(projectId || "")] || {};
    } catch (e) {
      payment = {};
    }
  }
  payment = payment || {};
  if (normalizePaymentStage_(payment.paymentStatus) === "LUNAS") return true;

  var projectTotal = Number(payment.projectTotal || 0);
  var totalPaid = Number(payment.totalPaid != null ? payment.totalPaid : payment.amount || 0);
  if (projectTotal > 0 && totalPaid >= projectTotal) return true;

  var remaining = payment.remainingAmount;
  if (projectTotal > 0 && remaining !== "" && remaining != null && Number(remaining) <= 0 && totalPaid > 0) {
    return true;
  }
  return false;
}

/**
 * Gate Drive klien = 2 syarat:
 * 1) Production Ops 100% selesai
 * 2) Payment Lunas
 */
function getClientDriveGateState_(lead, productionOps, paymentHint) {
  lead = lead || {};
  var ops = productionOps || buildClientProductionOpsReport_(lead);
  var projectId = normalizeProjectId_(lead.projectId || lead.id || "");
  var productionReady = isProductionOpsCompleteForDrive_(lead, ops);
  var paymentReady = isProjectPaymentLunas_(projectId, paymentHint);
  var unlocked = productionReady && paymentReady;
  var note = "";
  if (unlocked) {
    note = "";
  } else if (!productionReady && !paymentReady) {
    note = "Folder Google Drive dibuka setelah Production Ops 100% selesai dan payment Lunas.";
  } else if (!productionReady) {
    note = "Folder Google Drive dibuka setelah Production Ops 100% selesai. Payment sudah Lunas.";
  } else {
    note = "Folder Google Drive dibuka setelah payment Lunas. Production Ops sudah 100%.";
  }
  return {
    unlocked: unlocked,
    productionReady: productionReady,
    paymentReady: paymentReady,
    note: note
  };
}

/** @deprecated gunakan getClientDriveGateState_ — tetap ada untuk kompatibilitas pemanggilan lama. */
function isClientDriveUnlocked_(lead, productionOps, paymentHint) {
  return getClientDriveGateState_(lead, productionOps, paymentHint).unlocked;
}

function getDriveDeliveryPropKey_(projectId) {
  return "DRIVE_DELIVERED_" + normalizeProjectId_(projectId);
}

/**
 * Sinkronkan gate Drive klien:
 * - belum production 100% ATAU belum Lunas → cabut akses klien
 * - keduanya siap → share viewer + kirim email link Drive (sekali)
 */
function syncClientDriveGate_(projectId) {
  projectId = normalizeProjectId_(projectId);
  var result = {
    unlocked: false,
    productionReady: false,
    paymentReady: false,
    acl: null,
    mail: { sent: false, reason: "" },
    reason: ""
  };
  if (!projectId) {
    result.reason = "missing_project";
    return result;
  }

  var lead = getLeadByProjectId_(projectId);
  if (!lead) {
    result.reason = "lead_not_found";
    return result;
  }

  var driveUrl = String(lead.driveUrl || "").trim();
  var folder = getFolderByDriveUrl_(driveUrl);
  var clientEmail = resolveClientEmail_(projectId, null, []);
  if (!clientEmail) {
    clientEmail = String(lead.clientEmail || lead.email || "").trim().toLowerCase();
  }

  if (!folder) {
    result.reason = "no_folder";
    return result;
  }

  var gate = getClientDriveGateState_(lead);
  result.unlocked = gate.unlocked;
  result.productionReady = gate.productionReady;
  result.paymentReady = gate.paymentReady;

  var props = PropertiesService.getScriptProperties();
  var aclStateKey = "ACL_STATE_" + projectId;
  var desiredAclState = gate.unlocked ? "UNLOCKED" : "GATED";
  var lastAclState = props.getProperty(aclStateKey) || "";
  if (lastAclState === desiredAclState) {
    result.acl = { skipped: true, reason: "acl_unchanged", clientGated: !gate.unlocked };
  } else {
    result.acl = applyProjectFolderAcl_(folder, clientEmail, { shareWithClient: gate.unlocked });
    props.setProperty(aclStateKey, desiredAclState);
  }

  if (!gate.unlocked) {
    if (!gate.productionReady && !gate.paymentReady) {
      result.reason = "gated_until_production_and_lunas";
    } else if (!gate.productionReady) {
      result.reason = "gated_until_production_complete";
    } else {
      result.reason = "gated_until_payment_lunas";
    }
    return result;
  }

  var propKey = getDriveDeliveryPropKey_(projectId);
  var alreadyDelivered = !!props.getProperty(propKey);
  if (alreadyDelivered) {
    result.mail = { sent: false, reason: "already_delivered" };
    result.reason = "unlocked_already_delivered";
    return result;
  }

  if (isValidEmail_(clientEmail) && driveUrl) {
    result.mail = sendDriveDeliveryToClient_(
      projectId,
      lead.clientName || "",
      clientEmail,
      driveUrl
    ) || { sent: false, reason: "send_failed" };
    if (result.mail.sent) {
      props.setProperty(propKey, new Date().toISOString());
      result.reason = "unlocked_and_delivered";
    } else {
      result.reason = "unlocked_mail_failed";
    }
  } else {
    result.mail = { sent: false, reason: "invalid_client_email" };
    result.reason = "unlocked_no_email";
  }
  return result;
}

function getFolderByDriveUrl_(driveUrl) {
  var id = extractDriveIdFromUrl_(driveUrl);
  if (!id) return null;
  try {
    return DriveApp.getFolderById(id);
  } catch (e) {
    Logger.log("getFolderByDriveUrl_ gagal: " + e.message);
    return null;
  }
}

/**
 * Perbaiki ACL semua folder project yang sudah ada di Leads/DriveAssets.
 * Pastikan tiap klien hanya bisa buka foldernya sendiri.
 */
function resolveClientEmail_(projectId, row, headers) {
  var headerMap = getHeaderIndexMap_(headers || []);
  var email = "";
  if (headerMap.email !== undefined && row) {
    email = String(row[headerMap.email] || "").trim();
  }
  if (!isValidEmail_(email)) {
    email = String(getEmailFromClientIntake_(projectId) || "").trim();
  }
  if (!isValidEmail_(email)) {
    email = String(getEmailFromPayments_(projectId) || "").trim();
  }
  return isValidEmail_(email) ? email : "";
}

function getEmailFromPayments_(projectId) {
  try {
    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var normTarget = normalizeProjectId_(projectId);
    if (!normTarget) return "";
    var sheets = [CONFIG.SHEET_PAYMENTS, CONFIG.SHEET_PAY_INVOICES];
    for (var s = 0; s < sheets.length; s++) {
      var sheet = ss.getSheetByName(sheets[s]);
      if (!sheet || sheet.getLastRow() < 2) continue;
      var data = sheet.getDataRange().getValues();
      var map = getHeaderIndexMap_(data[0]);
      var pidCol = map.projectid !== undefined ? map.projectid : map.id;
      var emailCol = map.clientemail !== undefined ? map.clientemail : map.email;
      if (pidCol === undefined || emailCol === undefined) continue;
      for (var i = data.length - 1; i >= 1; i--) {
        if (normalizeProjectId_(data[i][pidCol]) !== normTarget) continue;
        var email = String(data[i][emailCol] || "").trim();
        if (isValidEmail_(email)) return email;
      }
    }
    return "";
  } catch (e) {
    return "";
  }
}

function serializePaymentMap_(raw, invoiceCountMap, invoiceAggMap) {
  var safe = {};
  var countMap = invoiceCountMap || null;
  var aggMap = invoiceAggMap || getInvoiceAggMap_();

  function putEntry(key, entry) {
    if (!key) return;
    safe[key] = entry;
    var bare = String(key).replace(/^#/, "");
    if (bare && bare !== key) safe[bare] = entry;
    var hashed = "#" + bare;
    if (hashed !== key) safe[hashed] = entry;
  }

  Object.keys(raw || {}).forEach(function(k) {
    var p = raw[k];
    var pid = normalizeProjectId_(k || p.projectId);
    var agg = aggMap[pid] || {};
    var sheetPaid = Number(p.amount || 0);
    // Invoice sheet = sumber kebenaran; baris Payments bisa stale setelah approve.
    var totalPaid = agg.count ? Number(agg.total || 0) : sheetPaid;
    if (!totalPaid && sheetPaid) totalPaid = sheetPaid;
    var projectTotal = Number(p.projectTotal || 0);
    var remainingAmount = projectTotal ? Math.max(projectTotal - totalPaid, 0) : (
      p.remainingAmount !== "" && p.remainingAmount != null ? Number(p.remainingAmount) : ""
    );
    var invoiceCount = agg.count || (countMap ? (countMap[pid] || countMap[k] || 0) : 0);
    var lastAmount = agg.lastAmount !== "" && agg.lastAmount != null
      ? Number(agg.lastAmount)
      : (p.lastAmount !== "" && p.lastAmount != null ? Number(p.lastAmount) : "");
    putEntry(pid || k, {
      paymentId: String(p.paymentId || ""),
      paymentStatus: normalizePaymentStage_(p.paymentStatus),
      amount: totalPaid,
      totalPaid: totalPaid,
      lastAmount: lastAmount,
      projectTotal: projectTotal || "",
      remainingAmount: remainingAmount,
      paymentMethod: String(agg.lastPaymentMethod || p.paymentMethod || ""),
      paymentDate: formatCellValue_(agg.lastPaymentDate || p.paymentDate),
      bankReference: String(p.bankReference || ""),
      validatedAt: formatCellValue_(agg.lastValidatedAt || p.validatedAt),
      invoiceNumber: String(agg.lastInvoiceNumber || p.invoiceNumber || ""),
      invoiceUrl: String(agg.lastInvoiceUrl || p.invoiceUrl || ""),
      invoiceSentAt: formatCellValue_(p.invoiceSentAt),
      invoiceCount: invoiceCount
    });
  });
  return safe;
}

// Perbaiki baris Payments yang amount-nya tertinggal dibanding total invoice.
// options.write=false: hanya koreksi di memori (jalur sync/dashboard) — hindari
// tulis sheet saat Direktur refresh bersamaan dengan Officer yang sedang submit.
function syncPaymentTotalsFromInvoices_(raw, invoiceAggMap, options) {
  raw = raw || {};
  invoiceAggMap = invoiceAggMap || {};
  options = options || {};
  var allowWrite = options.write === true;
  Object.keys(invoiceAggMap).forEach(function(pid) {
    var agg = invoiceAggMap[pid];
    var row = raw[pid];
    if (!row || !agg || !agg.count) return;
    var invoiceTotal = Number(agg.total || 0);
    var sheetPaid = Number(row.amount || 0);
    if (invoiceTotal === sheetPaid) return;

    var projectTotal = Number(row.projectTotal || 0);
    var remainingAmount = projectTotal ? Math.max(projectTotal - invoiceTotal, 0) : (
      row.remainingAmount !== "" && row.remainingAmount != null ? Number(row.remainingAmount) : ""
    );
    if (allowWrite) {
      upsertPaymentRecord_({
        paymentId: row.paymentId,
        projectId: pid,
        clientName: row.clientName,
        clientEmail: row.clientEmail,
        amount: invoiceTotal,
        lastAmount: agg.lastAmount,
        projectTotal: projectTotal || "",
        remainingAmount: remainingAmount,
        paymentMethod: agg.lastPaymentMethod || row.paymentMethod || "",
        paymentDate: agg.lastPaymentDate || row.paymentDate || "",
        proofUrl: row.proofUrl || "",
        bankReference: row.bankReference || "",
        notes: row.notes || "",
        paymentStatus: row.paymentStatus || "PAYMENT AWAL",
        validatedAt: row.validatedAt || "",
        validatedBy: row.validatedBy || "",
        invoiceNumber: agg.lastInvoiceNumber || row.invoiceNumber || "",
        invoiceUrl: agg.lastInvoiceUrl || row.invoiceUrl || "",
        invoiceSentAt: row.invoiceSentAt || "",
        createdAt: row.createdAt || ""
      });
    }
    row.amount = invoiceTotal;
    row.lastAmount = agg.lastAmount;
    row.remainingAmount = remainingAmount;
    row.invoiceNumber = agg.lastInvoiceNumber || row.invoiceNumber;
    row.invoiceUrl = agg.lastInvoiceUrl || row.invoiceUrl;
    if (agg.lastPaymentMethod) row.paymentMethod = agg.lastPaymentMethod;
    if (agg.lastPaymentDate) row.paymentDate = agg.lastPaymentDate;
  });
}

function normalizePaymentStage_(status) {
  status = String(status || "").trim().toUpperCase();
  if (status === "PAYMENT AWAL") return "PAYMENT AWAL";
  if (status === "PAYMENT SETELAH SHOOTING") return "PAYMENT SETELAH SHOOTING";
  if (status === "LUNAS") return "LUNAS";
  if (status === "INVOICED") return "PAYMENT AWAL";
  return "UNPAID";
}

// Baca status pembayaran hanya untuk Tim Internal.
function getPaymentStatusMap(accessKey) {
  try {
    requireInternalRole_(accessKey);
    initializePaymentSheets_();
    var raw = getPaymentsMapByProject_();
    var invoiceAgg = getInvoiceAggMap_();
    return { success: true, paymentMap: serializePaymentMap_(raw, null, invoiceAgg) };
  } catch (err) {
    return { success: false, error: err.message, paymentMap: {} };
  }
}

// Endpoint ringan untuk PIC Production Ops (tanpa payment/approval/backfill berat).
function getProductionOpsData(accessKey) {
  return getProductionOpsData_(accessKey, true);
}

function getProductionOpsDataFresh(accessKey) {
  return getProductionOpsData_(accessKey, false);
}

function getProductionOpsData_(accessKey, useCache) {
  try {
    var ctx = requireProductionOpsRole_(accessKey);

    if (useCache !== false) {
      var cached = getCacheLarge_(CACHE_KEY_PRODOPS);
      if (cached && cached.success) {
        return slimProductionOpsPayloadForRole_(cached, ctx, true);
      }
    }

    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var leads = [];
    var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
    if (leadsSheet && leadsSheet.getLastRow() > 1) {
      var leadData = leadsSheet.getDataRange().getValues();
      var leadHeaders = leadData[0];
      for (var i = 1; i < leadData.length; i++) {
        var obj = {};
        for (var c = 0; c < leadHeaders.length; c++) {
          obj[String(leadHeaders[c]).trim().toLowerCase()] = leadData[i][c];
        }
        if (!obj.id && !obj.projectid) continue;
        if (!obj.id && obj.projectid) obj.id = obj.projectid;
        leads.push(obj);
      }
    }
    var result = {
      success: true,
      leads: leads,
      deptFolderMap: getDeptFolderMap_(ss),
      opsFolderCatalog: getOpsFolderCatalogMap_(ss),
      syncTimestamp: new Date().toISOString()
    };
    putCache_(CACHE_KEY_PRODOPS, result);
    return slimProductionOpsPayloadForRole_(result, ctx, false);
  } catch (err) {
    return {
      success: false,
      error: err.message,
      leads: [],
      deptFolderMap: {},
      opsFolderCatalog: {}
    };
  }
}

function takeLastApprovals_(list, limit) {
  list = list || [];
  limit = limit || 40;
  if (list.length <= limit) return list;
  return list.slice(list.length - limit);
}

/** Ringkas approval untuk list/sync — bukti transfer dimuat saat buka modal review. */
function slimPaymentApprovalForList_(item) {
  item = Object.assign({}, item || {});
  var hasProof = !!(item.proofUrl || item.proofFileId);
  item.proofUrl = "";
  item.proofFileId = "";
  item.proofFileName = hasProof ? (item.proofFileName || "attached") : "";
  item.hasProof = hasProof;
  delete item._rowIndex;
  return item;
}

function slimApprovalListForTransport_(list) {
  return (list || []).map(function(item) {
    if (item && (item.type === "DEPT" || item.departmentId)) {
      var dept = Object.assign({}, item);
      delete dept._rowIndex;
      return dept;
    }
    return slimPaymentApprovalForList_(item);
  });
}

// Ambil payload operation dari CacheService lalu re-filter approval/notifikasi
// sesuai role pemanggil. Return null bila cache belum tersedia.
// Leads disimpan terpisah di CACHE_KEY_PRODOPS, di-merge kembali di sini.
function buildOperationDataFromCache_(ctx) {
  var cached = getCacheLarge_(CACHE_KEY_OPERATION);
  if (!cached || !cached.success) return null;
  var out = {};
  Object.keys(cached).forEach(function(key) { out[key] = cached[key]; });
  // Leads tidak disimpan di cache operation (terlalu besar) — ambil dari prodops cache.
  if (!out.leads || !out.leads.length) {
    var prodOps = getCacheLarge_(CACHE_KEY_PRODOPS);
    out.leads = (prodOps && prodOps.leads) ? prodOps.leads : [];
  }
  var allPend = out._allPendingPay || [];
  var pendDept = out._allPendingDept || [];
  out.pendingApprovals = filterPaymentApprovalsForRole_(allPend, ctx)
    .concat(filterDeptApprovalsForRole_(pendDept, ctx));
  out.pendingApprovalCount = out.pendingApprovals.length;
  var notif = buildOpsNotificationsForContext_(
    ctx, allPend,
    out._rejectedPay || [], out._approvedPay || [],
    out.leads || [],
    pendDept, out._rejectedDept || [], out._approvedDept || []
  );
  out.notifications = notif.notifications;
  out.rejectedApprovals = notif.rejectedForUser;
  out.actionCount = notif.actionCount;
  out.fromCache = true;
  return out;
}

/**
 * Field berawalan "_" hanya dipakai server untuk re-filter saat cache hit.
 * Browser tidak memakainya, jadi jangan dikirim.
 *
 * PENTING: response google.script.run dibatasi ~50KB. Jika payload terlalu
 * besar, client menerima undefined → "Tidak ada respons dari server".
 * Strategi: strip internal fields + slim approvals + limit notifikasi +
 * ringkas opsFolderCatalog & deptFolderMap.
 */
var LEAD_TRANSPORT_FIELDS_ = ["id","projectid","client","brandname","category","projecttype","status",
  "email","pic","notes","driveurl","timestamp","projecttotal","totalmurid",
  "shootingdays","shootingstartdate","shootingenddate","shootingdatelabel",
  "shootingreleasedat","productionstage","productionupdatedat","productionupdatedby",
  "productionnotes","productionopsdata","productionopsupdatedat","productionopsupdatedby"];

var LEAD_PIC_TRANSPORT_FIELDS_ = ["id","projectid","client","brandname","category","projecttype","status",
  "pic","driveurl","timestamp",
  "shootingdays","shootingstartdate","shootingenddate","shootingdatelabel",
  "productionstage","productionupdatedat","productionupdatedby",
  "productionnotes","productionopsdata","productionopsupdatedat","productionopsupdatedby"];

function slimLeadsByFields_(leads, fields) {
  fields = fields || LEAD_TRANSPORT_FIELDS_;
  return (leads || []).map(function(l) {
    var slim = {};
    Object.keys(l || {}).forEach(function(k) {
      if (fields.indexOf(String(k).toLowerCase()) >= 0) slim[k] = l[k];
    });
    return slim;
  });
}

/** Buang kolom sheet yang tidak dipakai dashboard agar payload jauh lebih kecil. */
function slimLeadsForTransport_(leads) {
  return slimLeadsByFields_(leads, LEAD_TRANSPORT_FIELDS_);
}

function slimLeadsForPic_(leads) {
  return slimLeadsByFields_(leads, LEAD_PIC_TRANSPORT_FIELDS_);
}

function slimProductionOpsPayloadForRole_(payload, ctx, fromCache) {
  if (!payload || typeof payload !== "object") return payload;
  var out = {};
  Object.keys(payload).forEach(function(key) { out[key] = payload[key]; });
  if (fromCache) out.fromCache = true;
  out.leads = isDeptPicRole_(ctx && ctx.role)
    ? slimLeadsForPic_(out.leads)
    : slimLeadsForTransport_(out.leads);
  return out;
}

function stripInternalFields_(payload) {
  if (!payload || typeof payload !== "object") return payload;
  var out = {};
  Object.keys(payload).forEach(function(key) {
    if (key.charAt(0) !== "_") out[key] = payload[key];
  });
  out.pendingApprovals = slimApprovalListForTransport_(out.pendingApprovals);
  out.rejectedApprovals = slimApprovalListForTransport_(takeLastApprovals_(out.rejectedApprovals, 20));
  if (out.notifications && out.notifications.length > 40) {
    out.notifications = out.notifications.slice(0, 40);
  }
  if (out.leads && out.leads.length) out.leads = slimLeadsForTransport_(out.leads);
  return out;
}

var CACHE_WARM_LOCK_KEY_ = "opsDataWarming_v1";

/**
 * Pemanas cache opsData. Cache dibuang setiap ada operasi tulis, sehingga
 * permintaan pertama sesudahnya menanggung rebuild penuh (~5-10s). Trigger
 * berkala memindahkan biaya itu ke background, bukan ke user yang login.
 * Private — tidak callable via google.script.run; aman sebagai trigger handler.
 */
function warmOperationDataCache_() {
  try {
    if (getCacheLarge_(CACHE_KEY_OPERATION)) {
      return { success: true, warmed: false, reason: "Cache masih hangat." };
    }
    var cache = CacheService.getScriptCache();
    // Hindari dua eksekusi membangun ulang bersamaan.
    if (cache.get(CACHE_WARM_LOCK_KEY_)) {
      return { success: true, warmed: false, reason: "Pemanasan lain sedang jalan." };
    }
    cache.put(CACHE_WARM_LOCK_KEY_, "1", 120);
    var startedAt = Date.now();
    try {
      buildOperationDataForCtx_({ role: "DIRECTOR", email: "", name: "cache-warmer", projectId: "" }, false);
    } finally {
      cache.remove(CACHE_WARM_LOCK_KEY_);
    }
    var elapsed = Date.now() - startedAt;
    Logger.log("warmOperationDataCache_: rebuild " + elapsed + "ms");
    return { success: true, warmed: true, elapsedMs: elapsed };
  } catch (err) {
    Logger.log("warmOperationDataCache_ gagal: " + err.message);
    return { success: false, error: err.message };
  }
}

/** Jalankan sekali dari editor Apps Script untuk memasang trigger pemanas. */
function installOperationCacheWarmer_() {
  var triggers = ScriptApp.getProjectTriggers();
  var handler = "warmOperationDataCache_";
  for (var i = 0; i < triggers.length; i++) {
    var name = triggers[i].getHandlerFunction();
    // Bersihkan trigger lama (nama publik sebelum hardening).
    if (name === "warmOperationDataCache") {
      ScriptApp.deleteTrigger(triggers[i]);
      continue;
    }
    if (name === handler) {
      return { success: true, message: "Trigger pemanas cache sudah aktif." };
    }
  }
  ScriptApp.newTrigger(handler)
    .timeBased()
    .everyMinutes(10)
    .create();
  return { success: true, message: "Trigger pemanas cache dipasang (tiap 10 menit)." };
}

/** Hapus trigger pemanas. Hanya dari editor Apps Script. */
function removeOperationCacheWarmer_() {
  var removed = 0;
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var name = triggers[i].getHandlerFunction();
    if (name === "warmOperationDataCache_" || name === "warmOperationDataCache") {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }
  return { success: true, removed: removed };
}

// ---------------------------------------------------------------------------
// Transport aman untuk payload besar.
//
// Serializer objek google.script.run tidak sanggup memindahkan object graph
// besar/dalam: success handler menerima `undefined` tanpa error apa pun, dan
// client menampilkan "Tidak ada respons dari server". Direktur paling sering
// kena karena melihat SELURUH antrean approval + notifikasi, dan payload itu
// makin besar setiap ada approval baru — makanya gagalnya menetap walau relogin.
//
// Mengirim JSON string melewati serializer itu sepenuhnya; string berukuran
// megabyte tetap sampai utuh. Client memanggil JSON.parse untuk membukanya.
// ---------------------------------------------------------------------------
var OPS_PACK_SOFT_LIMIT_ = 900000;

/**
 * @param {Object} payload  Objek hasil endpoint.
 * @param {string} label    Untuk log ukuran payload.
 * @param {Array<Function>} trimSteps  Dijalankan berurutan selama payload masih
 *   di atas OPS_PACK_SOFT_LIMIT_. Urutkan dari yang paling tidak penting.
 * @return {string} JSON string siap kirim.
 */
function packPayload_(payload, label, trimSteps) {
  if (!payload || typeof payload !== "object") {
    return JSON.stringify({ success: false, error: "Server tidak menghasilkan payload." });
  }
  var json;
  try {
    json = JSON.stringify(payload);
  } catch (err) {
    return JSON.stringify({ success: false, error: "Payload gagal diserialisasi: " + err.message });
  }
  var originalKb = Math.round(json.length / 1024);
  var steps = trimSteps || [];
  for (var i = 0; i < steps.length && json.length > OPS_PACK_SOFT_LIMIT_; i++) {
    try {
      steps[i](payload);
      json = JSON.stringify(payload);
    } catch (trimErr) {
      Logger.log(label + " trim step " + i + " gagal: " + trimErr.message);
      break;
    }
  }
  var finalKb = Math.round(json.length / 1024);
  Logger.log(label + " packed=" + finalKb + "KB (asli " + originalKb + "KB)");
  return json;
}

function packOperationPayload_(raw) {
  return packPayload_(stripInternalFields_(raw), "opsData", [
    // Katalog folder Drive paling besar dan paling jarang dipakai di dashboard;
    // view Production Ops memuatnya lagi lewat endpoint sendiri.
    function(p) { p.opsFolderCatalog = {}; p.opsFolderCatalogTrimmed = true; },
    function(p) { p.notifications = (p.notifications || []).slice(0, 15); },
    function(p) { p.rejectedApprovals = (p.rejectedApprovals || []).slice(0, 10); },
    function(p) {
      (p.leads || []).forEach(function(l) { delete l.notes; delete l.Notes; });
      p.leadNotesTrimmed = true;
    }
  ]);
}

// Endpoint gabungan: leads + payment map dalam satu round-trip.
// Menggunakan CacheService agar repeat-load (navigasi antar tab, refresh) instan.
function getOperationData(accessKey) {
  return stripInternalFields_(getOperationData_(accessKey, true));
}

// Dipakai tombol Sync/Refresh: lewati cache dan baca ulang dari Spreadsheet.
function getOperationDataFresh(accessKey) {
  return stripInternalFields_(getOperationData_(accessKey, false));
}

// Versi packed (JSON string) — dipakai dashboard. Lihat catatan di packPayload_.
function getOperationDataPacked(accessKey) {
  return packOperationPayload_(getOperationData_(accessKey, true));
}

function getOperationDataFreshPacked(accessKey) {
  return packOperationPayload_(getOperationData_(accessKey, false));
}

function getProductionOpsDataPacked(accessKey) {
  return packProductionOpsPayload_(getProductionOpsData_(accessKey, true));
}

function getProductionOpsDataFreshPacked(accessKey) {
  return packProductionOpsPayload_(getProductionOpsData_(accessKey, false));
}

function packProductionOpsPayload_(raw) {
  if (raw && raw.leads) raw.leads = slimLeadsForTransport_(raw.leads);
  return packPayload_(raw, "prodOps", [
    function(p) { (p.leads || []).forEach(function(l) { delete l.notes; }); }
  ]);
}

function getPendingApprovalsPacked(accessKey) {
  return packPayload_(getPendingApprovals(accessKey), "approvals", [
    function(p) {
      p.notifications = (p.notifications || []).slice(0, 20);
      p.approvals = p.notifications;
    },
    function(p) { p.rejectedApprovals = (p.rejectedApprovals || []).slice(0, 10); }
  ]);
}

function getOperationData_(accessKey, useCache) {
  try {
    var ctx = requireInternalRole_(accessKey);
    return buildOperationDataForCtx_(ctx, useCache);
  } catch (err) {
    return { success: false, error: err.message, leads: [], paymentMap: {}, deptFolderMap: {}, opsFolderCatalog: {}, pendingApprovals: [], rejectedApprovals: [], notifications: [], pendingApprovalCount: 0, actionCount: 0 };
  }
}

function buildOperationDataForCtx_(ctx, useCache) {
  try {
    var buildStartedAt = Date.now();
    // Coba serve dari cache dulu (instan ~50ms vs sheet ~5-10s).
    if (useCache !== false) {
      var cachedForCtx = buildOperationDataFromCache_(ctx);
      if (cachedForCtx) {
        cachedForCtx.buildMs = Date.now() - buildStartedAt;
        return cachedForCtx;
      }
    }

    // Jalur baca dashboard: jangan migrasi schema / repair / backfill.
    // Naiknya SCHEMA_GUARD_VERSION_ (kolom shooting) sempat membuat setiap
    // cache-miss menahan login sampai Analytics tampil, belasan detik.
    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));

    // Leads
    var leads = [];
    var driveByProject = getProjectDriveUrlMap_(ss);
    var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
    if (leadsSheet && leadsSheet.getLastRow() > 1) {
      var leadData = leadsSheet.getDataRange().getValues();
      var leadHeaders = leadData[0];
      for (var i = 1; i < leadData.length; i++) {
        var obj = {};
        for (var c = 0; c < leadHeaders.length; c++) {
          obj[String(leadHeaders[c]).trim().toLowerCase()] = leadData[i][c];
        }
        // Skip baris kosong / corrupt tanpa project id.
        if (!obj.id && !obj.projectid) continue;
        if (!obj.id && obj.projectid) obj.id = obj.projectid;
        var leadId = normalizeProjectId_(obj.id || obj.projectid);
        if (leadId && !String(obj.driveurl || obj.driveUrl || "").trim()) {
          obj.driveurl = driveByProject[leadId] || findDriveUrlInLeadRow_(leadData[i], getHeaderIndexMap_(leadHeaders));
        }
        leads.push(obj);
      }
    }

    // Payments (sekali baca + agregasi invoice sekali baca)
    var raw = getPaymentsMapByProject_();
    var invoiceAgg = getInvoiceAggMap_();
    // Jangan tulis sheet di jalur sync — hindari lock/contention saat Officer submit.
    syncPaymentTotalsFromInvoices_(raw, invoiceAgg, { write: false });
    var paymentMap = serializePaymentMap_(raw, null, invoiceAgg);

    // Baca tiap sheet approval SEKALI lalu filter di memori — hindari initialize berat berulang.
    var allPaymentApprovals = listPaymentApprovals_();
    var allDeptApprovals = listDeptApprovals_();
    var byApprovalStatus_ = function(list, status) {
      return list.filter(function(a) { return String(a.status || "").trim().toUpperCase() === status; });
    };
    var allPendingApprovals = byApprovalStatus_(allPaymentApprovals, "PENDING");
    var rejectedApprovals = byApprovalStatus_(allPaymentApprovals, "REJECTED");
    var approvedApprovals = byApprovalStatus_(allPaymentApprovals, "APPROVED");
    var pendingDept = byApprovalStatus_(allDeptApprovals, "PENDING");
    var rejectedDept = byApprovalStatus_(allDeptApprovals, "REJECTED");
    var approvedDept = byApprovalStatus_(allDeptApprovals, "APPROVED");

    var pendingApprovals = filterPaymentApprovalsForRole_(allPendingApprovals, ctx);
    var pendingDeptApprovals = filterDeptApprovalsForRole_(pendingDept, ctx);
    var notifBundle = buildOpsNotificationsForContext_(
      ctx,
      allPendingApprovals,
      rejectedApprovals,
      approvedApprovals,
      leads,
      pendingDept,
      rejectedDept,
      approvedDept
    );

    var deptFolderMap = getDeptFolderMap_(ss);
    var opsFolderCatalog = getOpsFolderCatalogMap_(ss);

    var result = {
      success: true,
      leads: leads,
      paymentMap: paymentMap,
      deptFolderMap: deptFolderMap,
      opsFolderCatalog: opsFolderCatalog,
      pendingApprovals: pendingApprovals.concat(pendingDeptApprovals),
      rejectedApprovals: notifBundle.rejectedForUser,
      notifications: notifBundle.notifications,
      pendingApprovalCount: pendingApprovals.length + pendingDeptApprovals.length,
      actionCount: notifBundle.actionCount,
      syncTimestamp: new Date().toISOString(),
      _allPendingPay: slimApprovalListForTransport_(allPendingApprovals),
      _rejectedPay: slimApprovalListForTransport_(takeLastApprovals_(rejectedApprovals, 30)),
      _approvedPay: slimApprovalListForTransport_(takeLastApprovals_(approvedApprovals, 30)),
      _allPendingDept: pendingDept,
      _rejectedDept: takeLastApprovals_(rejectedDept, 30),
      _approvedDept: takeLastApprovals_(approvedDept, 30)
    };
    // Cache: simpan TANPA leads (terbesar) agar muat di CacheService.
    // Leads disimpan terpisah di CACHE_KEY_PRODOPS.
    var cachePayload = {};
    Object.keys(result).forEach(function(k) {
      if (k !== "leads") cachePayload[k] = result[k];
    });
    cachePayload.leadsCount = leads.length;
    try { putCache_(CACHE_KEY_OPERATION, cachePayload); } catch (cacheErr) {
      Logger.log("putCache_ CACHE_KEY_OPERATION gagal: " + cacheErr.message);
    }
    // Leads ke cache prodops supaya buildOperationDataFromCache_ bisa mengambilnya.
    try {
      putCache_(CACHE_KEY_PRODOPS, {
        success: true,
        leads: leads,
        deptFolderMap: deptFolderMap,
        opsFolderCatalog: opsFolderCatalog,
        syncTimestamp: result.syncTimestamp
      });
    } catch (prodCacheErr) {
      Logger.log("putCache_ CACHE_KEY_PRODOPS gagal: " + prodCacheErr.message);
    }
    result.fromCache = false;
    result.buildMs = Date.now() - buildStartedAt;
    Logger.log("buildOperationDataForCtx_ rebuild " + result.buildMs + "ms, leads=" + leads.length
      + ", payloadEstimate=" + Math.round(JSON.stringify(result).length / 1024) + "KB");
    return result;
  } catch (err) {
    return { success: false, error: err.message, leads: [], paymentMap: {}, deptFolderMap: {}, opsFolderCatalog: {}, pendingApprovals: [], rejectedApprovals: [], notifications: [], pendingApprovalCount: 0, actionCount: 0 };
  }
}

function updatePaymentStageInternal(accessKey, projectId, newStatus) {
  var ctx = requireDirectorRole_(accessKey);
  try {
    initializePaymentSheets_();
    projectId = String(projectId || "").trim();
    newStatus = normalizePaymentStage_(newStatus);
    if (!projectId) return { success: false, error: "Project ID wajib diisi." };
    if (["PAYMENT AWAL", "PAYMENT SETELAH SHOOTING", "LUNAS"].indexOf(newStatus) < 0) {
      return { success: false, error: "Status pembayaran tidak valid." };
    }

    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var sheet = ss.getSheetByName(CONFIG.SHEET_PAYMENTS);
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: false, error: "Data pembayaran belum tersedia." };
    }

    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h || "").trim(); });
    var projectCol = headers.indexOf("projectId");
    var statusCol = headers.indexOf("paymentStatus");
    var paymentIdCol = headers.indexOf("paymentId");
    if (projectCol < 0 || statusCol < 0) {
      return { success: false, error: "Kolom Payments tidak lengkap." };
    }

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][projectCol]).trim() === projectId) {
        var oldStatus = normalizePaymentStage_(data[i][statusCol]);
        sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
        var paymentId = paymentIdCol >= 0 ? data[i][paymentIdCol] : "";
        logPaymentStatusChange_(paymentId, oldStatus, newStatus, ctx.email, "Status pembayaran diubah dari dashboard.");
        var driveGate = { unlocked: false, reason: "" };
        try {
          driveGate = syncClientDriveGate_(projectId);
        } catch (driveGateErr) {
          Logger.log("syncClientDriveGate_ setelah update payment stage gagal: " + driveGateErr.message);
          driveGate = { unlocked: false, reason: driveGateErr.message };
        }
        invalidateAllDataCaches_();
        return { success: true, projectId: projectId, paymentStatus: newStatus, driveGate: driveGate };
      }
    }

    return { success: false, error: "Project belum memiliki data invoice/payment." };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function upsertPaymentRecord_(paymentData) {
  initializePaymentSheets_();
  var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var sheet = ss.getSheetByName(CONFIG.SHEET_PAYMENTS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var projectCol = headers.indexOf("projectId");
  var targetId = normalizeProjectId_(paymentData.projectId);
  paymentData.projectId = targetId;

  var matchIndexes = [];
  for (var i = 1; i < data.length; i++) {
    if (sameProjectId_(data[i][projectCol], targetId)) {
      matchIndexes.push(i + 1);
    }
  }

  // Update row pertama yang cocok; hapus duplikat sisa agar total tidak “nyangkut” di row lama
  if (matchIndexes.length) {
    var primaryRow = matchIndexes[0];
    headers.forEach(function(h, idx) {
      if (paymentData[h] !== undefined && paymentData[h] !== null) {
        sheet.getRange(primaryRow, idx + 1).setValue(paymentData[h]);
      }
    });
    // Pastikan projectId tersimpan dalam format normal (#...)
    if (projectCol >= 0) sheet.getRange(primaryRow, projectCol + 1).setValue(targetId);

    for (var d = matchIndexes.length - 1; d >= 1; d--) {
      sheet.deleteRow(matchIndexes[d]);
    }
    return paymentData.paymentId || data[matchIndexes[0] - 1][0];
  }

  var seq = sheet.getLastRow();
  var paymentId = paymentData.paymentId || ("PAY-" + new Date().getFullYear() + "-" + String(seq).padStart(4, "0"));
  var rowData = {
    paymentId: paymentId,
    projectId: targetId,
    clientName: paymentData.clientName,
    clientEmail: paymentData.clientEmail,
    amount: Number(paymentData.amount),
    lastAmount: paymentData.lastAmount != null ? Number(paymentData.lastAmount) : "",
    projectTotal: paymentData.projectTotal ? Number(paymentData.projectTotal) : "",
    remainingAmount: paymentData.remainingAmount !== "" && paymentData.remainingAmount != null ? Number(paymentData.remainingAmount) : "",
    paymentMethod: paymentData.paymentMethod || "",
    paymentDate: paymentData.paymentDate || "",
    proofUrl: paymentData.proofUrl || "",
    bankReference: paymentData.bankReference || "",
    notes: paymentData.notes || "",
    paymentStatus: paymentData.paymentStatus || "PAYMENT AWAL",
    validatedAt: paymentData.validatedAt || "",
    validatedBy: paymentData.validatedBy || "",
    invoiceNumber: paymentData.invoiceNumber || "",
    invoiceUrl: paymentData.invoiceUrl || "",
    invoiceSentAt: paymentData.invoiceSentAt || "",
    createdAt: paymentData.createdAt || new Date().toLocaleString("id-ID")
  };
  var row = headers.map(function(header) {
    return rowData[header] !== undefined ? rowData[header] : "";
  });
  sheet.appendRow(row);
  return paymentId;
}

function ensureProductionDeptApprovalsSheet_(ss) {
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var sheet = ss.getSheetByName(CONFIG.SHEET_DEPT_APPROVALS);
  var headers = [
    "approvalId", "projectId", "clientName",
    "departmentId", "departmentLabel", "progress", "pic", "notes", "folderUrl",
    "status", "submittedBy", "submittedAt",
    "reviewedBy", "reviewedAt", "reviewNotes"
  ];
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_DEPT_APPROVALS);
    sheet.appendRow(headers);
    return sheet;
  }
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || "").trim();
  });
  var lower = existing.map(function(h) { return h.toLowerCase(); });
  headers.forEach(function(header) {
    if (lower.indexOf(header.toLowerCase()) < 0) {
      sheet.insertColumnAfter(sheet.getLastColumn());
      sheet.getRange(1, sheet.getLastColumn()).setValue(header);
      lower.push(header.toLowerCase());
    }
  });
  return sheet;
}

function serializeDeptApproval_(rowObj) {
  return {
    approvalId: String(rowObj.approvalId || rowObj.approvalid || ""),
    projectId: normalizeProjectId_(rowObj.projectId || rowObj.projectid || ""),
    clientName: String(rowObj.clientName || rowObj.clientname || ""),
    departmentId: String(rowObj.departmentId || rowObj.departmentid || "").trim(),
    departmentLabel: String(rowObj.departmentLabel || rowObj.departmentlabel || "").trim(),
    progress: Number(rowObj.progress || 0),
    pic: String(rowObj.pic || ""),
    notes: String(rowObj.notes || ""),
    folderUrl: String(rowObj.folderUrl || rowObj.folderurl || "").trim(),
    status: String(rowObj.status || "").trim().toUpperCase() || "PENDING",
    submittedBy: String(rowObj.submittedBy || rowObj.submittedby || ""),
    submittedAt: formatCellValue_(rowObj.submittedAt || rowObj.submittedat || ""),
    reviewedBy: String(rowObj.reviewedBy || rowObj.reviewedby || ""),
    reviewedAt: formatCellValue_(rowObj.reviewedAt || rowObj.reviewedat || ""),
    reviewNotes: String(rowObj.reviewNotes || rowObj.reviewnotes || ""),
    type: "DEPT"
  };
}

function listDeptApprovals_(statusFilter) {
  // Membaca approval TIDAK butuh migrasi/repair Leads yang berat — cukup pastikan sheet approval ada.
  var sheet = ensureProductionDeptApprovalsSheet_();
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var filter = statusFilter ? String(statusFilter).trim().toUpperCase() : "";
  var deptFolderMap = getDeptFolderMap_();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var obj = serializeDeptApproval_(rowObjectFromHeaders_(headers, data[i]));
    if (!obj.approvalId) continue;
    if (filter && obj.status !== filter) continue;
    if (!obj.folderUrl && obj.projectId && obj.departmentId) {
      var map = deptFolderMap[obj.projectId] || deptFolderMap[String(obj.projectId).replace(/^#/, "")] || {};
      obj.folderUrl = map[obj.departmentId] || "";
    }
    obj._rowIndex = i + 1;
    out.push(obj);
  }
  return out;
}

function getDeptApprovalById_(approvalId) {
  approvalId = String(approvalId || "").trim();
  if (!approvalId) return null;
  var list = listDeptApprovals_();
  for (var i = 0; i < list.length; i++) {
    if (list[i].approvalId === approvalId) return list[i];
  }
  return null;
}

function findPendingDeptApproval_(projectId, departmentId) {
  projectId = normalizeProjectId_(projectId);
  departmentId = String(departmentId || "").trim();
  if (!projectId || !departmentId) return null;
  var pending = listDeptApprovals_("PENDING");
  for (var i = 0; i < pending.length; i++) {
    if (pending[i].projectId === projectId && pending[i].departmentId === departmentId) {
      return pending[i];
    }
  }
  return null;
}

// Versi ringan untuk jalur simpan: pakai spreadsheet yang sudah terbuka, tanpa
// initializeGoogleSheets_ (repair/migrasi berat) dan tanpa folder map. Cukup baca
// baris PENDING milik satu project sekali saja.
function findPendingDeptApprovalLite_(ss, projectId, departmentId) {
  projectId = normalizeProjectId_(projectId);
  departmentId = String(departmentId || "").trim();
  if (!projectId || !departmentId) return null;
  var sheet = ss.getSheetByName(CONFIG.SHEET_DEPT_APPROVALS);
  if (!sheet || sheet.getLastRow() < 2) return null;
  var data = sheet.getDataRange().getValues();
  var headerMap = getHeaderIndexMap_(data[0].map(function(h) { return String(h || "").trim(); }));
  var idCol = headerMap.projectid;
  var deptCol = headerMap.departmentid;
  var statusCol = headerMap.status;
  if (idCol === undefined || deptCol === undefined || statusCol === undefined) return null;
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][statusCol] || "").trim().toUpperCase() !== "PENDING") continue;
    if (normalizeProjectId_(data[i][idCol]) !== projectId) continue;
    if (String(data[i][deptCol] || "").trim() !== departmentId) continue;
    return serializeDeptApproval_(rowObjectFromHeaders_(data[0], data[i]));
  }
  return null;
}

function updateDeptApprovalFields_(approvalId, fields) {
  var sheet = ensureProductionDeptApprovalsSheet_();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return false;
  var headers = data[0];
  var headerMap = getHeaderIndexMap_(headers);
  var idCol = headerMap.approvalid !== undefined ? headerMap.approvalid : 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol] || "").trim() !== approvalId) continue;
    Object.keys(fields || {}).forEach(function(key) {
      var idx = headerMap[String(key).toLowerCase()];
      if (idx === undefined) return;
      sheet.getRange(i + 1, idx + 1).setValue(sanitizeSheetCell_(fields[key]));
    });
    return true;
  }
  return false;
}

function appendDeptApproval_(approvalData) {
  var sheet = ensureProductionDeptApprovalsSheet_();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var approvalId = approvalData.approvalId || ("DPT-" + new Date().getFullYear() + "-" + String(new Date().getTime()).slice(-6));
  var rowData = {
    approvalId: approvalId,
    projectId: normalizeProjectId_(approvalData.projectId),
    clientName: approvalData.clientName || "",
    departmentId: String(approvalData.departmentId || "").trim(),
    departmentLabel: String(approvalData.departmentLabel || "").trim(),
    progress: Number(approvalData.progress || 100),
    pic: approvalData.pic || "",
    notes: approvalData.notes || "",
    folderUrl: approvalData.folderUrl || "",
    status: approvalData.status || "PENDING",
    submittedBy: approvalData.submittedBy || "",
    submittedAt: approvalData.submittedAt || new Date().toLocaleString("id-ID"),
    reviewedBy: approvalData.reviewedBy || "",
    reviewedAt: approvalData.reviewedAt || "",
    reviewNotes: approvalData.reviewNotes || ""
  };
  var row = headers.map(function(header) {
    var key = String(header || "").trim();
    return rowData[key] !== undefined ? sanitizeSheetCell_(rowData[key]) : "";
  });
  sheet.appendRow(row);
  return serializeDeptApproval_(rowData);
}

function filterDeptApprovalsForRole_(approvals, ctx) {
  approvals = approvals || [];
  ctx = ctx || {};
  if (ctx.role === "DIRECTOR") return approvals.slice();
  var myEmail = String(ctx.email || "").toLowerCase();
  return approvals.filter(function(item) {
    return String(item.submittedBy || "").toLowerCase() === myEmail;
  });
}

function applyDeptApprovalToLeadOps_(projectId, departmentId, patch) {
  projectId = normalizeProjectId_(projectId);
  departmentId = String(departmentId || "").trim();
  var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
  migrateLeadsSheetColumns_(leadsSheet);
  var data = leadsSheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h || "").trim(); });
  var headerMap = getHeaderIndexMap_(headers);
  var projectCol = headerMap.id !== undefined ? headerMap.id : 0;
  var opsDataCol = headers.indexOf("productionOpsData");
  var opsUpdatedAtCol = headers.indexOf("productionOpsUpdatedAt");
  var opsUpdatedByCol = headers.indexOf("productionOpsUpdatedBy");
  var stageCol = headers.indexOf("productionStage");
  var updatedAtCol = headers.indexOf("productionUpdatedAt");
  var updatedByCol = headers.indexOf("productionUpdatedBy");
  var notesCol = headers.indexOf("productionNotes");
  if (opsDataCol < 0) return { success: false, error: "Kolom productionOpsData belum tersedia." };

  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (normalizeProjectId_(data[i][projectCol]) === projectId) {
      rowIndex = i;
      break;
    }
  }
  if (rowIndex < 0) return { success: false, error: "Project tidak ditemukan." };

  var lead = getLeadByProjectId_(projectId);
  var folderId = extractDriveIdFromUrl_(lead ? lead.driveUrl : "");
  var folderCatalog = folderId
    ? syncProjectDriveFolderCatalog_(projectId, folderId)
    : getOpsFolderCatalogForProject_(projectId, ss);
  var items = normalizeProductionOpsData_(data[rowIndex][opsDataCol], folderCatalog);
  var found = false;
  items = items.map(function(item) {
    if (item.id !== departmentId) return item;
    found = true;
    var merged = {
      id: item.id,
      label: item.label,
      icon: item.icon,
      pic: (patch && patch.pic != null) ? patch.pic : item.pic,
      status: (patch && patch.status) || item.status,
      progress: patch && patch.progress != null ? patch.progress : item.progress,
      note: (patch && patch.note != null) ? patch.note : item.note,
      updatedAt: (patch && patch.updatedAt) || item.updatedAt,
      approvalStatus: (patch && patch.approvalStatus) || item.approvalStatus,
      approvalId: (patch && patch.approvalId) || item.approvalId,
      reviewNotes: (patch && patch.reviewNotes != null) ? patch.reviewNotes : item.reviewNotes,
      pendingProgress: patch && patch.pendingProgress !== undefined ? patch.pendingProgress : item.pendingProgress,
      pendingStatus: patch && patch.pendingStatus !== undefined ? patch.pendingStatus : item.pendingStatus,
      pendingPic: patch && patch.pendingPic !== undefined ? patch.pendingPic : item.pendingPic,
      pendingNote: patch && patch.pendingNote !== undefined ? patch.pendingNote : item.pendingNote,
      order: item.order
    };
    if (patch && patch.approvalStatus === "REJECTED" && !patch.status) {
      merged.status = deriveDeptStatusFromProgress_(merged.progress);
    }
    if (patch && patch.approvalStatus === "APPROVED" && patch.progress != null) {
      merged.status = deriveDeptStatusFromProgress_(patch.progress);
    }
    return normalizeProductionOpsItem_(merged, item, item.order);
  });
  if (!found) return { success: false, error: "Departemen tidak ditemukan di Production Ops." };

  var summary = getProductionOpsSummary_(items);
  var timestamp = new Date().toLocaleString("id-ID");
  var reviewer = String((patch && patch.reviewedBy) || "").trim();

  leadsSheet.getRange(rowIndex + 1, opsDataCol + 1).setValue(stringifyProductionOpsData_(items, folderCatalog));
  if (opsUpdatedAtCol >= 0) leadsSheet.getRange(rowIndex + 1, opsUpdatedAtCol + 1).setValue(timestamp);
  if (opsUpdatedByCol >= 0) leadsSheet.getRange(rowIndex + 1, opsUpdatedByCol + 1).setValue(reviewer);
  if (stageCol >= 0) leadsSheet.getRange(rowIndex + 1, stageCol + 1).setValue(summary.stage);
  if (updatedAtCol >= 0) leadsSheet.getRange(rowIndex + 1, updatedAtCol + 1).setValue(timestamp);
  if (updatedByCol >= 0) leadsSheet.getRange(rowIndex + 1, updatedByCol + 1).setValue(reviewer);
  if (notesCol >= 0) {
    var noteText = patch && patch.approvalStatus === "REJECTED"
      ? ("Validasi departemen ditolak: " + (patch.reviewNotes || departmentId))
      : ("Validasi departemen disetujui. Akumulasi " + summary.overallPercent + "%.");
    leadsSheet.getRange(rowIndex + 1, notesCol + 1).setValue(noteText);
  }

  return {
    success: true,
    opsData: items,
    opsUpdatedAt: timestamp,
    production: {
      stage: summary.stage,
      overallPercent: summary.overallPercent,
      updatedAt: timestamp,
      updatedBy: reviewer,
      notes: ""
    }
  };
}

function approveDeptCompletion(accessKey, approvalId, reviewNotes) {
  try {
    var ctx = requireDirectorRole_(accessKey);
    initializeGoogleSheets_();
    var approval = getDeptApprovalById_(approvalId);
    if (!approval) return { success: false, error: "Pengajuan departemen tidak ditemukan." };
    if (approval.status !== "PENDING") return { success: false, error: "Pengajuan ini sudah diproses." };
    assertNotSelfApprover_(ctx, approval.submittedBy);

    var timestamp = new Date().toLocaleString("id-ID");
    var cleanNotes = String(reviewNotes || "").trim();
    updateDeptApprovalFields_(approvalId, {
      status: "APPROVED",
      reviewedBy: ctx.email || "",
      reviewedAt: timestamp,
      reviewNotes: cleanNotes
    });

    var applied = applyDeptApprovalToLeadOps_(approval.projectId, approval.departmentId, {
      status: deriveDeptStatusFromProgress_(approval.progress),
      progress: Number(approval.progress || 0),
      pic: approval.pic || "",
      note: approval.notes || "",
      approvalStatus: "APPROVED",
      approvalId: approvalId,
      reviewNotes: cleanNotes,
      pendingProgress: "",
      pendingStatus: "",
      pendingPic: "",
      pendingNote: "",
      reviewedBy: ctx.email || "",
      updatedAt: timestamp
    });
    if (!applied.success) return applied;

    var driveGate = { unlocked: false, reason: "" };
    try {
      driveGate = syncClientDriveGate_(approval.projectId);
    } catch (driveGateErr) {
      Logger.log("syncClientDriveGate_ setelah approve dept gagal: " + driveGateErr.message);
      driveGate = { unlocked: false, reason: driveGateErr.message };
    }

    invalidateAllDataCaches_();
    appendAuditLog_(
      ctx.email,
      "DEPT_APPROVE",
      approvalId,
      "project=" + approval.projectId + ";dept=" + approval.departmentId + ";by=" + approval.submittedBy,
      "OK"
    );
    return {
      success: true,
      type: "DEPT",
      approvalId: approvalId,
      projectId: approval.projectId,
      departmentId: approval.departmentId,
      departmentLabel: approval.departmentLabel,
      folderUrl: approval.folderUrl || "",
      reviewNotes: cleanNotes,
      opsData: applied.opsData,
      opsUpdatedAt: applied.opsUpdatedAt,
      production: applied.production,
      driveGate: driveGate
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function rejectDeptCompletion(accessKey, approvalId, reviewNotes) {
  try {
    var ctx = requireDirectorRole_(accessKey);
    initializeGoogleSheets_();
    reviewNotes = String(reviewNotes || "").trim();
    if (!reviewNotes) return { success: false, error: "Catatan reject wajib diisi." };

    var approval = getDeptApprovalById_(approvalId);
    if (!approval) return { success: false, error: "Pengajuan departemen tidak ditemukan." };
    if (approval.status !== "PENDING") return { success: false, error: "Pengajuan ini sudah diproses." };

    var timestamp = new Date().toLocaleString("id-ID");
    updateDeptApprovalFields_(approvalId, {
      status: "REJECTED",
      reviewedBy: ctx.email || "",
      reviewedAt: timestamp,
      reviewNotes: reviewNotes
    });

    var applied = applyDeptApprovalToLeadOps_(approval.projectId, approval.departmentId, {
      approvalStatus: "REJECTED",
      approvalId: approvalId,
      reviewNotes: reviewNotes,
      note: reviewNotes,
      pendingProgress: "",
      pendingStatus: "",
      pendingPic: "",
      pendingNote: "",
      reviewedBy: ctx.email || "",
      updatedAt: timestamp
    });
    if (!applied.success) return applied;

    invalidateAllDataCaches_();
    appendAuditLog_(
      ctx.email,
      "DEPT_REJECT",
      approvalId,
      "project=" + approval.projectId + ";dept=" + approval.departmentId + ";by=" + approval.submittedBy,
      "OK"
    );
    return {
      success: true,
      type: "DEPT",
      approvalId: approvalId,
      projectId: approval.projectId,
      departmentId: approval.departmentId,
      departmentLabel: approval.departmentLabel,
      reviewNotes: reviewNotes,
      opsData: applied.opsData,
      opsUpdatedAt: applied.opsUpdatedAt,
      production: applied.production
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function ensurePaymentApprovalsSheet_(ss) {
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var sheet = ss.getSheetByName(CONFIG.SHEET_PAY_APPROVALS);
  var headers = [
    "approvalId", "projectId", "paymentId", "clientName", "clientEmail",
    "amount", "projectTotal", "paymentMethod", "paymentDate", "notes",
    "proofUrl", "proofFileName", "proofFileId",
    "requestedPaymentStatus",
    "status", "submittedBy", "submittedAt",
    "reviewedBy", "reviewedAt", "reviewNotes"
  ];
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_PAY_APPROVALS);
    sheet.appendRow(headers);
    return sheet;
  }
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || "").trim();
  });
  var lower = existing.map(function(h) { return h.toLowerCase(); });
  headers.forEach(function(header) {
    if (lower.indexOf(header.toLowerCase()) < 0) {
      sheet.insertColumnAfter(sheet.getLastColumn());
      sheet.getRange(1, sheet.getLastColumn()).setValue(header);
      lower.push(header.toLowerCase());
    }
  });
  return sheet;
}

function rowObjectFromHeaders_(headers, row) {
  var obj = {};
  (headers || []).forEach(function(h, idx) {
    obj[String(h || "").trim()] = row[idx];
    obj[String(h || "").trim().toLowerCase()] = row[idx];
  });
  return obj;
}

function sanitizePaymentApprovalForRole_(item, ctx) {
  item = Object.assign({}, item || {});
  if (!ctx || ctx.role !== "DIRECTOR") {
    item.proofUrl = "";
    item.proofFileId = "";
    item.proofFileName = "";
    item.hasProof = false;
  } else {
    item.hasProof = !!(item.proofUrl || item.proofFileId);
  }
  delete item._rowIndex;
  return item;
}

function filterPaymentApprovalsForRole_(approvals, ctx) {
  approvals = approvals || [];
  ctx = ctx || {};
  // List/sync selalu tanpa URL bukti — bukti diambil via getPaymentApprovalDetail.
  if (ctx.role === "DIRECTOR") {
    return approvals.map(function(item) { return slimPaymentApprovalForList_(item); });
  }
  var myEmail = String(ctx.email || "").toLowerCase();
  return approvals
    .filter(function(item) { return String(item.submittedBy || "").toLowerCase() === myEmail; })
    .map(function(item) { return slimPaymentApprovalForList_(item); });
}

/** Detail satu pengajuan (termasuk bukti) — dipanggil saat buka modal Review. */
function getPaymentApprovalDetail(accessKey, approvalId) {
  try {
    var ctx = requireInternalRole_(accessKey);
    approvalId = String(approvalId || "").trim();
    if (!approvalId) return { success: false, error: "Approval ID wajib diisi." };
    var approval = getPaymentApprovalById_(approvalId);
    if (!approval) return { success: false, error: "Pengajuan tidak ditemukan." };
    if (ctx.role !== "DIRECTOR") {
      var myEmail = String(ctx.email || "").toLowerCase();
      if (String(approval.submittedBy || "").toLowerCase() !== myEmail) {
        return { success: false, error: "Akses ditolak untuk pengajuan ini." };
      }
    }
    return { success: true, approval: sanitizePaymentApprovalForRole_(approval, ctx) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function serializePaymentApproval_(rowObj) {
  return {
    approvalId: String(rowObj.approvalId || rowObj.approvalid || ""),
    projectId: normalizeProjectId_(rowObj.projectId || rowObj.projectid || ""),
    paymentId: String(rowObj.paymentId || rowObj.paymentid || ""),
    clientName: String(rowObj.clientName || rowObj.clientname || ""),
    clientEmail: String(rowObj.clientEmail || rowObj.clientemail || ""),
    amount: Number(rowObj.amount || 0),
    projectTotal: rowObj.projectTotal !== "" && rowObj.projectTotal != null
      ? Number(rowObj.projectTotal || rowObj.projecttotal || 0)
      : "",
    paymentMethod: String(rowObj.paymentMethod || rowObj.paymentmethod || ""),
    paymentDate: formatCellValue_(rowObj.paymentDate || rowObj.paymentdate || ""),
    notes: String(rowObj.notes || ""),
    proofUrl: String(rowObj.proofUrl || rowObj.proofurl || ""),
    proofFileName: String(rowObj.proofFileName || rowObj.prooffilename || ""),
    proofFileId: String(rowObj.proofFileId || rowObj.prooffileid || ""),
    requestedPaymentStatus: normalizePaymentStage_(rowObj.requestedPaymentStatus || rowObj.requestedpaymentstatus || ""),
    status: String(rowObj.status || "").trim().toUpperCase() || "PENDING",
    submittedBy: String(rowObj.submittedBy || rowObj.submittedby || ""),
    submittedAt: formatCellValue_(rowObj.submittedAt || rowObj.submittedat || ""),
    reviewedBy: String(rowObj.reviewedBy || rowObj.reviewedby || ""),
    reviewedAt: formatCellValue_(rowObj.reviewedAt || rowObj.reviewedat || ""),
    reviewNotes: String(rowObj.reviewNotes || rowObj.reviewnotes || ""),
    type: "PAYMENT"
  };
}

function listPaymentApprovals_(statusFilter) {
  // Membaca approval TIDAK butuh init/migrasi payment yang berat — cukup pastikan sheet approval ada.
  var sheet = ensurePaymentApprovalsSheet_();
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var filter = statusFilter ? String(statusFilter).trim().toUpperCase() : "";
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var obj = serializePaymentApproval_(rowObjectFromHeaders_(headers, data[i]));
    if (!obj.approvalId) continue;
    if (filter && obj.status !== filter) continue;
    obj._rowIndex = i + 1;
    out.push(obj);
  }
  return out;
}

function getPaymentApprovalById_(approvalId) {
  approvalId = String(approvalId || "").trim();
  if (!approvalId) return null;
  var list = listPaymentApprovals_();
  for (var i = 0; i < list.length; i++) {
    if (list[i].approvalId === approvalId) return list[i];
  }
  return null;
}

function updatePaymentApprovalFields_(approvalId, fields) {
  var sheet = ensurePaymentApprovalsSheet_();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return false;
  var headers = data[0];
  var headerMap = getHeaderIndexMap_(headers);
  var idCol = headerMap.approvalid !== undefined ? headerMap.approvalid : 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol] || "").trim() !== approvalId) continue;
    Object.keys(fields || {}).forEach(function(key) {
      var idx = headerMap[String(key).toLowerCase()];
      if (idx === undefined) return;
      sheet.getRange(i + 1, idx + 1).setValue(sanitizeSheetCell_(fields[key]));
    });
    return true;
  }
  return false;
}

function appendPaymentApproval_(approvalData) {
  var sheet = ensurePaymentApprovalsSheet_();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var approvalId = approvalData.approvalId || ("APR-" + new Date().getFullYear() + "-" + String(new Date().getTime()).slice(-6));
  var rowData = {
    approvalId: approvalId,
    projectId: normalizeProjectId_(approvalData.projectId),
    paymentId: approvalData.paymentId || "",
    clientName: approvalData.clientName || "",
    clientEmail: approvalData.clientEmail || "",
    amount: Number(approvalData.amount || 0),
    projectTotal: approvalData.projectTotal !== "" && approvalData.projectTotal != null ? Number(approvalData.projectTotal) : "",
    paymentMethod: approvalData.paymentMethod || "",
    paymentDate: approvalData.paymentDate || "",
    notes: approvalData.notes || "",
    proofUrl: approvalData.proofUrl || "",
    proofFileName: approvalData.proofFileName || "",
    proofFileId: approvalData.proofFileId || "",
    requestedPaymentStatus: normalizePaymentStage_(approvalData.requestedPaymentStatus || approvalData.paymentStatus || "") || "",
    status: approvalData.status || "PENDING",
    submittedBy: approvalData.submittedBy || "",
    submittedAt: approvalData.submittedAt || new Date().toLocaleString("id-ID"),
    reviewedBy: approvalData.reviewedBy || "",
    reviewedAt: approvalData.reviewedAt || "",
    reviewNotes: approvalData.reviewNotes || ""
  };
  var row = headers.map(function(header) {
    var key = String(header || "").trim();
    return rowData[key] !== undefined ? sanitizeSheetCell_(rowData[key]) : "";
  });
  sheet.appendRow(row);
  return serializePaymentApproval_(rowData);
}

function getProofBlobFromApproval_(approval) {
  if (!approval) return null;
  try {
    if (approval.proofFileId) {
      return DriveApp.getFileById(approval.proofFileId).getBlob();
    }
    var url = String(approval.proofUrl || "");
    var match = url.match(/[-\w]{25,}/);
    if (match) return DriveApp.getFileById(match[0]).getBlob();
  } catch (e) {
    Logger.log("Gagal ambil bukti transfer dari Drive: " + e.message);
  }
  return null;
}

function sendPendingPaymentReviewNotification_(approval) {
  try {
    MailApp.sendEmail({
      to: CONFIG.EMAIL_FROM,
      name: getMailIdentity_().name,
      replyTo: getMailIdentity_().replyTo,
      subject: "[FA Studio] Menunggu Approval Pembayaran — " + normalizeProjectId_(approval.projectId),
      htmlBody: buildInternalEmailShellHtml_("Pembayaran Menunggu Review Direktur", [
        "<p>Officer telah mengajukan pembayaran. Mohon review sebelum tervalidasi.</p>",
        buildEmailInfoTableHtml_([
          { label: "Approval ID", value: approval.approvalId || "-" },
          { label: "Project ID", value: normalizeProjectId_(approval.projectId) },
          { label: "Client", value: approval.clientName || "-" },
          { label: "Jumlah Diajukan", value: formatRupiahId_(approval.amount), strong: true },
          { label: "Status Payment (target)", value: formatEmailPaymentStatusLabel_(approval.requestedPaymentStatus) },
          { label: "Diajukan oleh", value: approval.submittedBy || "-" },
          {
            label: "Bukti",
            value: approval.proofUrl ? "<a href='" + safeEmailHref_(approval.proofUrl) + "'>Buka bukti transfer</a>" : "-",
            html: true
          }
        ]),
        "<p style='margin-top:16px;font-size:13px;color:#64748b'>Buka <strong>Operation System → Inbox Aksi</strong> untuk Approve / Reject.</p>"
      ].join(""))
    });
  } catch (e) {
    Logger.log("Notifikasi pending payment gagal: " + e.message);
  }
}

function buildPaymentFinalizePayload_(approval, lead, existing, ctx) {
  var projectId = normalizeProjectId_(approval.projectId);
  var currentAmount = Number(approval.amount || 0);
  var previousTotal = getTotalPaidForProject_(projectId);
  var newTotal = previousTotal + currentAmount;
  var projectTotal = Number(approval.projectTotal || existing.projectTotal || lead.projectTotal || 0);
  var oldStatus = normalizePaymentStage_(existing.paymentStatus);
  var remainingAmount = projectTotal ? Math.max(projectTotal - newTotal, 0) : "";
  var requested = normalizePaymentStage_(approval.requestedPaymentStatus || approval.paymentStatus || "");
  var nextPaymentStatus;
  if (projectTotal && remainingAmount <= 0) {
    nextPaymentStatus = "LUNAS";
  } else if (requested && requested !== "UNPAID" && requested !== "LUNAS") {
    nextPaymentStatus = requested;
  } else if (requested === "LUNAS" && (!projectTotal || remainingAmount <= 0)) {
    nextPaymentStatus = "LUNAS";
  } else {
    nextPaymentStatus = oldStatus === "UNPAID" ? "PAYMENT AWAL" : oldStatus;
  }
  var paymentId = existing.paymentId || approval.paymentId || ("PAY-" + new Date().getFullYear() + "-" + String(new Date().getTime()).slice(-4));
  var invoiceSeq = getInvoiceCountForProject_(projectId) + 1;
  var invoiceNumber = "INV/FA/" + new Date().getFullYear() + "/"
    + paymentId.replace("PAY-", "") + "-" + String(invoiceSeq).padStart(2, "0");
  var validatedAt = new Date().toLocaleString("id-ID");

  return {
    projectId: projectId,
    paymentId: paymentId,
    clientEmail: approval.clientEmail,
    currentAmount: currentAmount,
    previousTotal: previousTotal,
    newTotal: newTotal,
    projectTotal: projectTotal,
    remainingAmount: remainingAmount,
    oldStatus: oldStatus,
    nextPaymentStatus: nextPaymentStatus,
    invoiceSeq: invoiceSeq,
    invoiceNumber: invoiceNumber,
    validatedAt: validatedAt,
    payment: {
      paymentId: paymentId,
      projectId: projectId,
      clientName: lead.clientName,
      category: lead.category || "",
      clientEmail: approval.clientEmail,
      amount: currentAmount,
      currentAmount: currentAmount,
      totalPaid: newTotal,
      previousTotal: previousTotal,
      projectTotal: projectTotal,
      remainingAmount: remainingAmount,
      invoiceSequence: invoiceSeq,
      paymentMethod: approval.paymentMethod || "",
      paymentDate: approval.paymentDate || "",
      notes: approval.notes || "",
      paymentStatus: nextPaymentStatus,
      validatedAt: validatedAt,
      validatedBy: ctx.email,
      createdAt: existing.createdAt || new Date().toLocaleString("id-ID"),
      proofUrl: approval.proofUrl || ""
    }
  };
}

function finalizeApprovedPayment_(approval, ctx) {
  var projectId = normalizeProjectId_(approval.projectId);
  var lead = getLeadByProjectId_(projectId);
  if (!lead) return { success: false, error: "Project ID tidak ditemukan di database client." };
  if (!isValidEmail_(approval.clientEmail)) {
    return { success: false, error: "Email client tidak valid pada pengajuan pembayaran." };
  }

  var paymentsMap = getPaymentsMapByProject_();
  var existing = paymentsMap[projectId] || paymentsMap[String(approval.projectId)] || {};
  var built = buildPaymentFinalizePayload_(approval, lead, existing, ctx);
  if (built.projectTotal && built.newTotal > built.projectTotal) {
    return {
      success: false,
      error: "Jumlah pembayaran melebihi total harga project. Sisa pembayaran saat ini Rp "
        + Math.max(built.projectTotal - built.previousTotal, 0).toLocaleString("id-ID") + "."
    };
  }

  var payment = built.payment;
  var htmlContent = buildInvoiceHTML_(payment, built.invoiceNumber);
  var blob = Utilities.newBlob(htmlContent, "text/html", "Invoice.html");
  var pdfBlob = blob.getAs("application/pdf");
  pdfBlob.setName("Invoice_" + built.invoiceNumber.replace(/\//g, "-") + ".pdf");

  var invoiceUrl = saveInvoiceToDrive_(projectId, pdfBlob);
  var proofBlob = getProofBlobFromApproval_(approval);
  var proofUrl = approval.proofUrl || "";
  var sentAt = new Date().toLocaleString("id-ID");

  MailApp.sendEmail({
    to: approval.clientEmail,
    name: getMailIdentity_().name,
    replyTo: getMailIdentity_().replyTo,
    subject: "[FA Studio] Invoice " + built.invoiceNumber + " — " + lead.clientName,
    htmlBody: buildInvoiceEmailBody_(payment, built.invoiceNumber, invoiceUrl),
    attachments: [pdfBlob]
  });

  payment.invoiceNumber = built.invoiceNumber;
  payment.invoiceUrl = invoiceUrl;
  payment.proofUrl = proofUrl;
  payment.invoiceSentAt = sentAt;

  upsertPaymentRecord_({
    paymentId: built.paymentId,
    projectId: projectId,
    clientName: lead.clientName,
    clientEmail: approval.clientEmail,
    amount: built.newTotal,
    lastAmount: built.currentAmount,
    projectTotal: built.projectTotal,
    remainingAmount: built.remainingAmount,
    paymentMethod: approval.paymentMethod || "",
    paymentDate: approval.paymentDate || "",
    proofUrl: proofUrl,
    bankReference: "",
    notes: approval.notes || "",
    paymentStatus: built.nextPaymentStatus,
    validatedAt: built.validatedAt,
    validatedBy: ctx.email,
    invoiceNumber: built.invoiceNumber,
    invoiceUrl: invoiceUrl,
    invoiceSentAt: sentAt,
    createdAt: existing.createdAt || new Date().toLocaleString("id-ID")
  });

  logPaymentInvoice_({
    projectId: projectId,
    paymentId: built.paymentId,
    invoiceNumber: built.invoiceNumber,
    amount: built.currentAmount,
    totalPaid: built.newTotal,
    projectTotal: built.projectTotal,
    remainingAmount: built.remainingAmount,
    paymentMethod: approval.paymentMethod || "",
    paymentDate: approval.paymentDate || "",
    bankReference: "",
    invoiceUrl: invoiceUrl,
    proofUrl: proofUrl,
    validatedBy: ctx.email,
    notes: approval.notes || ""
  });

  sendInvoiceInternalNotification_(payment, built.invoiceNumber, invoiceUrl, pdfBlob, proofBlob, proofUrl);

  logPaymentStatusChange_(built.paymentId, built.oldStatus, built.nextPaymentStatus, ctx.email,
    "Invoice #" + built.invoiceSeq + " disetujui Direktur: Rp " + built.currentAmount.toLocaleString("id-ID")
    + " · Total kumulatif Rp " + built.newTotal.toLocaleString("id-ID"));

  updatePaymentApprovalFields_(approval.approvalId, {
    status: "APPROVED",
    paymentId: built.paymentId,
    reviewedBy: ctx.email,
    reviewedAt: built.validatedAt,
    reviewNotes: ""
  });

  sendOfficerPaymentDecisionEmail_({
    decision: "APPROVED",
    approval: approval,
    reviewedBy: ctx.email,
    invoiceNumber: built.invoiceNumber,
    invoiceUrl: invoiceUrl,
    paymentStatus: built.nextPaymentStatus
  });

  var driveGate = { unlocked: false, reason: "" };
  try {
    driveGate = syncClientDriveGate_(projectId);
  } catch (driveGateErr) {
    Logger.log("syncClientDriveGate_ setelah payment approve gagal: " + driveGateErr.message);
    driveGate = { unlocked: false, reason: driveGateErr.message };
  }

  invalidateAllDataCaches_();
  return {
    success: true,
    invoiceNumber: built.invoiceNumber,
    invoiceUrl: invoiceUrl,
    sentTo: approval.clientEmail,
    projectId: projectId,
    lastAmount: built.currentAmount,
    totalPaid: built.newTotal,
    previousTotal: built.previousTotal,
    projectTotal: built.projectTotal,
    remainingAmount: built.remainingAmount,
    proofUrl: proofUrl,
    paymentStatus: built.nextPaymentStatus,
    driveGate: driveGate,
    approvalId: approval.approvalId
  };
}

function submitPaymentForReview(accessKey, invoiceData) {
  var ctx = requireInternalRole_(accessKey);
  try {
    initializePaymentSheets_();
    invoiceData = invoiceData || {};
    var projectId = normalizeProjectId_(invoiceData.projectId);
    var lead = getLeadByProjectId_(projectId);
    if (!lead) return { success: false, error: "Project ID tidak ditemukan di database client." };

    var clientEmail = (invoiceData.clientEmail || lead.clientEmail || "").toString().trim();
    if (!isValidEmail_(clientEmail)) clientEmail = resolveClientEmail_(projectId, null, []);
    if (!isValidEmail_(clientEmail)) {
      return {
        success: false,
        error: "Email client tidak valid/tidak ditemukan. Cek kolom email di ClientIntake atau Leads."
      };
    }
    if (!invoiceData.amount || Number(invoiceData.amount) <= 0) {
      return { success: false, error: "Jumlah pembayaran harus diisi." };
    }
    if (!invoiceData.proofFile || !invoiceData.proofFile.data) {
      return { success: false, error: "Bukti transfer wajib dilampirkan." };
    }
    var proofValidation = validateProofFile_(invoiceData.proofFile);
    if (!proofValidation.success) return proofValidation;

    var paymentsMap = getPaymentsMapByProject_();
    var existing = paymentsMap[projectId] || {};
    var currentAmount = Number(invoiceData.amount);
    var previousTotal = getTotalPaidForProject_(projectId);
    var newTotal = previousTotal + currentAmount;
    var projectTotal = Number(invoiceData.projectTotal || existing.projectTotal || lead.projectTotal || 0);
    if (projectTotal && newTotal > projectTotal) {
      return {
        success: false,
        error: "Jumlah pembayaran melebihi total harga project. Sisa pembayaran saat ini Rp "
          + Math.max(projectTotal - previousTotal, 0).toLocaleString("id-ID") + "."
      };
    }

    var pendingForProject = listPaymentApprovals_("PENDING").filter(function(a) {
      return sameProjectId_(a.projectId, projectId);
    });
    if (pendingForProject.length) {
      return {
        success: false,
        error: "Masih ada pengajuan pembayaran menunggu approval Direktur untuk project ini ("
          + pendingForProject[0].approvalId + ")."
      };
    }

    var paymentId = existing.paymentId || ("PAY-" + new Date().getFullYear() + "-" + String(new Date().getTime()).slice(-4));
    var proofResult = saveTransferProofToDrive_(projectId, paymentId, invoiceData.proofFile);
    if (!proofResult.url) {
      return { success: false, error: "Gagal menyimpan bukti transfer ke Drive." };
    }

    var requestedPaymentStatus = normalizePaymentStage_(invoiceData.paymentStatus || invoiceData.requestedPaymentStatus || "");
    if (projectTotal && Math.max(projectTotal - newTotal, 0) <= 0) {
      requestedPaymentStatus = "LUNAS";
    } else if (!requestedPaymentStatus || requestedPaymentStatus === "UNPAID") {
      requestedPaymentStatus = "PAYMENT AWAL";
    } else if (requestedPaymentStatus === "LUNAS" && projectTotal && (projectTotal - newTotal) > 0) {
      return { success: false, error: "Status Lunas hanya bisa dipilih jika sisa pembayaran setelah invoice ini = 0." };
    }

    var proofFileId = "";
    try {
      var idMatch = String(proofResult.url).match(/[-\w]{25,}/);
      if (idMatch) proofFileId = idMatch[0];
    } catch (e) {}

    var approval = appendPaymentApproval_({
      projectId: projectId,
      paymentId: paymentId,
      clientName: lead.clientName,
      clientEmail: clientEmail,
      amount: currentAmount,
      projectTotal: projectTotal || "",
      paymentMethod: invoiceData.paymentMethod || "",
      paymentDate: invoiceData.paymentDate || "",
      notes: invoiceData.notes || "",
      proofUrl: proofResult.url,
      proofFileName: sanitizeProofFileName_((invoiceData.proofFile && invoiceData.proofFile.name) || "bukti-transfer"),
      proofFileId: proofFileId,
      requestedPaymentStatus: requestedPaymentStatus,
      status: "PENDING",
      submittedBy: ctx.email,
      submittedAt: new Date().toLocaleString("id-ID")
    });

    // Direktur submit → auto-approve agar tidak double work
    if (ctx.role === "DIRECTOR") {
      var approved = finalizeApprovedPayment_(approval, ctx);
      if (!approved.success) return approved;
      approved.pending = false;
      approved.autoApproved = true;
      return approved;
    }

    sendPendingPaymentReviewNotification_(approval);
    invalidateAllDataCaches_();
    return {
      success: true,
      pending: true,
      approvalId: approval.approvalId,
      projectId: projectId,
      amount: currentAmount,
      projectTotal: projectTotal || "",
      remainingPreview: projectTotal ? Math.max(projectTotal - newTotal, 0) : "",
      proofUrl: proofResult.url,
      requestedPaymentStatus: requestedPaymentStatus,
      status: "PENDING_REVIEW",
      message: "Pengajuan pembayaran menunggu approval Direktur."
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function parseFlexibleDate_(value) {
  if (value == null || value === "") return null;
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) return value;
  var s = String(value).trim();
  var iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;
  var m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:[,\s]+(\d{1,2})[.:](\d{2})(?:[.:](\d{2}))?)?/);
  if (m) {
    return new Date(
      Number(m[3]),
      Number(m[2]) - 1,
      Number(m[1]),
      Number(m[4] || 0),
      Number(m[5] || 0),
      Number(m[6] || 0)
    );
  }
  return null;
}

function daysSinceDate_(value) {
  var d = parseFlexibleDate_(value);
  if (!d) return null;
  return Math.floor((new Date().getTime() - d.getTime()) / 86400000);
}

function getOpsInboxStateKey_(email) {
  return "OPS_INBOX_" + Utilities.base64EncodeWebSafe(String(email || "").toLowerCase()).slice(0, 80);
}

function getOpsInboxState_(email) {
  try {
    var raw = PropertiesService.getScriptProperties().getProperty(getOpsInboxStateKey_(email));
    if (!raw) return { read: {}, dismissed: {} };
    var parsed = JSON.parse(raw);
    return {
      read: parsed.read || {},
      dismissed: parsed.dismissed || {}
    };
  } catch (e) {
    return { read: {}, dismissed: {} };
  }
}

function saveOpsInboxState_(email, state) {
  try {
    PropertiesService.getScriptProperties().setProperty(
      getOpsInboxStateKey_(email),
      JSON.stringify({
        read: state.read || {},
        dismissed: state.dismissed || {},
        updatedAt: new Date().toISOString()
      })
    );
  } catch (e) {
    Logger.log("saveOpsInboxState_ gagal: " + e.message);
  }
}

function markOpsNotificationState(accessKey, notificationId, action) {
  try {
    var ctx = requireInternalRole_(accessKey);
    notificationId = String(notificationId || "").trim();
    action = String(action || "").trim().toLowerCase();
    if (!notificationId) return { success: false, error: "ID notifikasi wajib." };
    if (["read", "dismiss", "undismiss"].indexOf(action) < 0) {
      return { success: false, error: "Aksi tidak valid." };
    }
    var state = getOpsInboxState_(ctx.email);
    if (action === "read") state.read[notificationId] = new Date().toISOString();
    if (action === "dismiss") state.dismissed[notificationId] = new Date().toISOString();
    if (action === "undismiss") delete state.dismissed[notificationId];
    saveOpsInboxState_(ctx.email, state);
    return { success: true, notificationId: notificationId, action: action, state: state };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getLeadField_(lead, keys, fallback) {
  lead = lead || {};
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (lead[k] != null && String(lead[k]).trim() !== "") return lead[k];
    var lower = String(k).toLowerCase();
    if (lead[lower] != null && String(lead[lower]).trim() !== "") return lead[lower];
  }
  return fallback != null ? fallback : "";
}

function loadLeadsForNotifications_(ss) {
  ss = ss || SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var sheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var leads = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[String(headers[j] || "").trim()] = data[i][j];
      obj[String(headers[j] || "").trim().toLowerCase()] = data[i][j];
    }
    if (!obj.id && obj.projectid) obj.id = obj.projectid;
    leads.push(obj);
  }
  return leads;
}

function buildLeadOpsNotifications_(leads, ctx) {
  leads = leads || [];
  ctx = ctx || {};
  var isDirector = ctx.role === "DIRECTOR";
  var myEmail = String(ctx.email || "").toLowerCase();
  var items = [];

  leads.forEach(function(lead) {
    var projectId = normalizeProjectId_(getLeadField_(lead, ["id", "projectId", "projectid"]));
    if (!projectId) return;
    var status = String(getLeadField_(lead, ["status"], "")).trim();
    var client = String(getLeadField_(lead, ["client", "clientName", "brandName"], "Client")).trim() || "Client";
    var pic = String(getLeadField_(lead, ["pic", "picName"], "")).trim();
    var timestamp = getLeadField_(lead, ["timestamp", "createdAt", "createdat"], "");
    var productionStage = String(getLeadField_(lead, ["productionStage", "productionstage"], "")).trim();
    var productionUpdatedAt = getLeadField_(lead, ["productionUpdatedAt", "productionupdatedat"], "");
    var ageDays = daysSinceDate_(timestamp);
    var prodAge = daysSinceDate_(productionUpdatedAt || timestamp);
    var picMine = pic && myEmail && pic.toLowerCase().indexOf(myEmail.split("@")[0]) >= 0;

    // Role filter: officer hanya lihat lead yang PIC-nya dia / semua new lead (supaya tidak miss)
    var relevant = isDirector || !pic || picMine || status === "New Lead";

    if (status === "New Lead" && relevant) {
      items.push({
        id: "LEAD_NEW_" + projectId,
        type: "NEW_LEAD",
        group: "lead",
        groupLabel: "Lead & Client",
        groupOrder: 3,
        category: "action",
        actionable: true,
        informational: false,
        title: "Lead baru masuk",
        description: client + " perlu follow-up & dealing oleh Officer",
        projectId: projectId,
        clientName: client,
        timestamp: timestamp,
        actionLabel: "Buka Client Status",
        tag: ageDays != null && ageDays >= 2 ? "Aging" : "Lead",
        tagClass: ageDays != null && ageDays >= 2 ? "rejected" : "pending",
        targetView: "internal-db",
        targetAction: "open_project"
      });
    }

    if ((status === "New Lead" || status === "In Progress") && ageDays != null && ageDays >= 3 && relevant) {
      items.push({
        id: "LEAD_STUCK_" + projectId,
        type: "STUCK_LEAD",
        group: "lead",
        groupLabel: "Lead & Client",
        groupOrder: 3,
        category: "action",
        actionable: true,
        informational: false,
        title: "Lead mengendap " + ageDays + " hari",
        description: client + " masih \"" + status + "\" — Officer perlu segera follow-up",
        projectId: projectId,
        clientName: client,
        timestamp: timestamp,
        actionLabel: "Tindaklanjuti",
        tag: "SLA",
        tagClass: "rejected",
        targetView: "internal-db",
        targetAction: "open_project"
      });
    }

    if (status === "Deal") {
      var stageNorm = normalizeProductionStage_(productionStage) || "On Discuss";
      var noProgress = !productionUpdatedAt || stageNorm === "On Discuss";
      if (noProgress && ageDays != null && ageDays >= 5 && (isDirector || relevant)) {
        items.push({
          id: "DEAL_STUCK_" + projectId,
          type: "STUCK_DEAL",
          group: "lead",
          groupLabel: "Lead & Client",
          groupOrder: 3,
          category: "action",
          actionable: true,
          informational: false,
          title: "Deal belum jalan produksi",
          description: client + " Deal " + ageDays + " hari · stage masih " + stageNorm,
          projectId: projectId,
          clientName: client,
          timestamp: productionUpdatedAt || timestamp,
          actionLabel: "Update tracking",
          tag: "Produksi",
          tagClass: "pending",
          targetView: "internal-db",
          targetAction: "open_project"
        });
      }
    }

    if ((status === "Deal" || status === "In-Production") && prodAge != null && prodAge >= 7 && (isDirector || relevant)) {
      items.push({
        id: "PROD_STALE_" + projectId,
        type: "PRODUCTION_STALE",
        group: "monitoring",
        groupLabel: "Monitoring Produksi",
        groupOrder: 4,
        category: "info",
        actionable: false,
        informational: true,
        title: "Progress produksi diam " + prodAge + " hari",
        description: client + " · " + (formatProductionStageLabel_(productionStage) || "belum ada stage") + " · cek PIC dept",
        projectId: projectId,
        clientName: client,
        timestamp: productionUpdatedAt || timestamp,
        actionLabel: "Cek tracking",
        tag: "Info",
        tagClass: "approved",
        targetView: "internal-db",
        targetAction: "open_project"
      });
    }

    if ((status === "On Hold" || status === "Cancelled") && (isDirector || relevant)) {
      items.push({
        id: "STATUS_" + status.replace(/\s+/g, "_").toUpperCase() + "_" + projectId,
        type: status === "On Hold" ? "STATUS_HOLD" : "STATUS_CANCELLED",
        group: "monitoring",
        groupLabel: "Monitoring Produksi",
        groupOrder: 4,
        category: "info",
        actionable: false,
        informational: true,
        title: status === "On Hold" ? "Project On Hold" : "Project Cancelled",
        description: client + " berstatus " + status,
        projectId: projectId,
        clientName: client,
        timestamp: timestamp,
        actionLabel: "Lihat project",
        tag: status,
        tagClass: "rejected",
        targetView: "internal-db",
        targetAction: "open_project"
      });
    }

    // Info: production baru di-update (< 2 hari) — untuk awareness
    if (productionUpdatedAt && prodAge != null && prodAge <= 1 && productionStage && (isDirector || relevant)) {
      items.push({
        id: "PROD_UPDATE_" + projectId + "_" + String(productionUpdatedAt).slice(0, 10),
        type: "PRODUCTION_UPDATE",
        group: "monitoring",
        groupLabel: "Monitoring Produksi",
        groupOrder: 4,
        category: "info",
        actionable: false,
        informational: true,
        title: "Progress produksi diupdate",
        description: client + " → " + formatProductionStageLabel_(productionStage),
        projectId: projectId,
        clientName: client,
        timestamp: productionUpdatedAt,
        actionLabel: "Lihat detail",
        tag: "Update",
        tagClass: "approved",
        targetView: "internal-db",
        targetAction: "open_project"
      });
    }
  });

  // Batasi volume agar inbox tetap ringan
  var capped = [];
  var prodUpdateCount = 0;
  items.forEach(function(n) {
    if (n.type === "PRODUCTION_UPDATE") {
      prodUpdateCount++;
      if (prodUpdateCount > 10) return;
    }
    capped.push(n);
  });
  return capped.slice(0, 60);
}

function formatOpsActorLabel_(email) {
  email = String(email || "").trim();
  if (!email) return "Tim internal";
  var local = email.split("@")[0] || email;
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

function buildDeptPendingDirectorNotif_(item) {
  var progress = Number(item.progress || 0);
  var deptLabel = String(item.departmentLabel || item.departmentId || "Departemen").trim();
  var client = String(item.clientName || item.projectId || "Project").trim();
  var actor = formatOpsActorLabel_(item.submittedBy);
  var picLine = item.pic ? (" · PIC lapangan: " + item.pic) : "";
  var noteLine = item.notes ? (" · \"" + String(item.notes).slice(0, 80) + "\"") : "";
  return {
    id: item.approvalId,
    approvalId: item.approvalId,
    type: "DEPT_PENDING",
    group: "production",
    groupLabel: "Production Ops",
    groupOrder: 1,
    category: "action",
    actionable: true,
    informational: false,
    title: progress >= 100
      ? ("Validasi penyelesaian " + deptLabel)
      : ("Validasi progress " + deptLabel + " · " + progress + "%"),
    description: actor + " (PIC dept) mengajukan progress " + progress + "% · " + client + picLine + noteLine,
    projectId: item.projectId,
    clientName: item.clientName,
    departmentId: item.departmentId,
    departmentLabel: item.departmentLabel,
    progress: progress,
    pic: item.pic,
    notes: item.notes,
    submittedBy: item.submittedBy,
    actorLabel: actor,
    timestamp: item.submittedAt,
    actionLabel: "Review & putuskan",
    tag: progress >= 100 ? "Selesai" : ("Progress " + progress + "%"),
    tagClass: "pending",
    status: "PENDING",
    targetView: "production-ops",
    targetAction: "review_dept"
  };
}

function buildPaymentPendingDirectorNotif_(item) {
  var client = String(item.clientName || item.projectId || "Project").trim();
  var actor = formatOpsActorLabel_(item.submittedBy);
  var amount = Number(item.amount || 0);
  return {
    id: item.approvalId,
    approvalId: item.approvalId,
    type: "PAYMENT_PENDING",
    group: "billing",
    groupLabel: "Billing & Invoice",
    groupOrder: 2,
    category: "action",
    actionable: true,
    informational: false,
    title: "Review pembayaran · Rp " + amount.toLocaleString("id-ID"),
    description: actor + " (Officer) mengajukan bukti bayar · " + client,
    projectId: item.projectId,
    clientName: item.clientName,
    amount: amount,
    submittedBy: item.submittedBy,
    actorLabel: actor,
    timestamp: item.submittedAt,
    actionLabel: "Review & putuskan",
    tag: "Pembayaran",
    tagClass: "pending",
    status: "PENDING",
    targetView: "doc-gen",
    targetAction: "review_payment"
  };
}

function buildOpsNotificationsForContext_(ctx, pending, rejected, approved, leads, pendingDept, rejectedDept, approvedDept) {
  pending = pending || [];
  rejected = rejected || [];
  approved = approved || [];
  pendingDept = pendingDept || [];
  rejectedDept = rejectedDept || [];
  approvedDept = approvedDept || [];
  leads = leads || [];
  ctx = ctx || {};
  var isDirector = ctx.role === "DIRECTOR";
  var myEmail = String(ctx.email || "").toLowerCase();
  var notifications = [];
  var rejectedForUser = [];

  if (isDirector) {
    rejectedForUser = rejected.slice(-20).concat(rejectedDept.slice(-20));
    pending.forEach(function(item) {
      notifications.push(buildPaymentPendingDirectorNotif_(item));
    });
    pendingDept.forEach(function(item) {
      notifications.push(buildDeptPendingDirectorNotif_(item));
    });
  } else {
    rejected.forEach(function(item) {
      if (String(item.submittedBy || "").toLowerCase() !== myEmail) return;
      rejectedForUser.push(item);
      var payActor = formatOpsActorLabel_(item.reviewedBy || "Direktur");
      notifications.push({
        id: item.approvalId,
        approvalId: item.approvalId,
        type: "PAYMENT_REJECTED",
        group: "billing",
        groupLabel: "Billing & Invoice",
        groupOrder: 2,
        category: "action",
        actionable: true,
        informational: false,
        title: "Pembayaran ditolak Direktur",
        description: item.reviewNotes
          ? (payActor + ": " + item.reviewNotes)
          : ((item.clientName || item.projectId) + " perlu diajukan ulang dengan bukti baru"),
        projectId: item.projectId,
        clientName: item.clientName,
        amount: item.amount,
        submittedBy: item.submittedBy,
        reviewedBy: item.reviewedBy,
        reviewNotes: item.reviewNotes,
        timestamp: item.reviewedAt || item.submittedAt,
        actionLabel: "Ajukan ulang di Billing",
        tag: "Perlu revisi",
        tagClass: "rejected",
        status: "REJECTED",
        targetView: "doc-gen",
        targetAction: "resubmit_payment"
      });
    });
    rejectedDept.forEach(function(item) {
      if (String(item.submittedBy || "").toLowerCase() !== myEmail) return;
      rejectedForUser.push(item);
      var deptLabel = String(item.departmentLabel || item.departmentId || "Departemen").trim();
      var dirActor = formatOpsActorLabel_(item.reviewedBy || "Direktur");
      notifications.push({
        id: item.approvalId,
        approvalId: item.approvalId,
        type: "DEPT_REJECTED",
        group: "production",
        groupLabel: "Production Ops",
        groupOrder: 1,
        category: "action",
        actionable: true,
        informational: false,
        title: "Progress " + deptLabel + " ditolak",
        description: item.reviewNotes
          ? (dirActor + ": " + item.reviewNotes)
          : (deptLabel + " perlu diperbaiki lalu diajukan ulang"),
        projectId: item.projectId,
        clientName: item.clientName,
        departmentId: item.departmentId,
        departmentLabel: item.departmentLabel,
        progress: Number(item.progress || 0),
        submittedBy: item.submittedBy,
        reviewedBy: item.reviewedBy,
        reviewNotes: item.reviewNotes,
        timestamp: item.reviewedAt || item.submittedAt,
        actionLabel: "Perbaiki di Production Ops",
        tag: "Perlu revisi",
        tagClass: "rejected",
        status: "REJECTED",
        targetView: "production-ops",
        targetAction: "open_dept"
      });
    });
    approved.slice().reverse().forEach(function(item) {
      if (String(item.submittedBy || "").toLowerCase() !== myEmail) return;
      notifications.push({
        id: "APPROVED_" + item.approvalId,
        approvalId: item.approvalId,
        type: "PAYMENT_APPROVED",
        group: "billing",
        groupLabel: "Billing & Invoice",
        groupOrder: 2,
        category: "done",
        actionable: false,
        informational: true,
        title: "Pembayaran disetujui",
        description: (item.clientName || item.projectId) + " · invoice sudah dikirim ke klien",
        projectId: item.projectId,
        clientName: item.clientName,
        amount: item.amount,
        submittedBy: item.submittedBy,
        reviewedBy: item.reviewedBy,
        timestamp: item.reviewedAt || item.submittedAt,
        actionLabel: "Lihat di Billing",
        tag: "Disetujui",
        tagClass: "approved",
        status: "APPROVED",
        targetView: "doc-gen",
        targetAction: "open_billing"
      });
    });
    approvedDept.slice().reverse().forEach(function(item) {
      if (String(item.submittedBy || "").toLowerCase() !== myEmail) return;
      var deptLabel = String(item.departmentLabel || item.departmentId || "Departemen").trim();
      var prog = Number(item.progress || 0);
      notifications.push({
        id: "DEPT_OK_" + item.approvalId,
        approvalId: item.approvalId,
        type: "DEPT_APPROVED",
        group: "production",
        groupLabel: "Production Ops",
        groupOrder: 1,
        category: "done",
        actionable: false,
        informational: true,
        title: "Progress " + deptLabel + " disetujui",
        description: prog + "% resmi disahkan · " + (item.clientName || item.projectId),
        projectId: item.projectId,
        clientName: item.clientName,
        departmentId: item.departmentId,
        departmentLabel: item.departmentLabel,
        progress: prog,
        submittedBy: item.submittedBy,
        reviewedBy: item.reviewedBy,
        timestamp: item.reviewedAt || item.submittedAt,
        actionLabel: "Lihat Production Ops",
        tag: "Disetujui",
        tagClass: "approved",
        status: "APPROVED",
        targetView: "production-ops",
        targetAction: "open_dept"
      });
    });
    pending.forEach(function(item) {
      if (String(item.submittedBy || "").toLowerCase() !== myEmail) return;
      notifications.push({
        id: "WAIT_" + item.approvalId,
        approvalId: item.approvalId,
        type: "PAYMENT_WAITING",
        group: "billing",
        groupLabel: "Billing & Invoice",
        groupOrder: 2,
        category: "info",
        actionable: false,
        informational: true,
        title: "Pengajuan pembayaran menunggu Direktur",
        description: (item.clientName || item.projectId) + " · Rp " + Number(item.amount || 0).toLocaleString("id-ID") + " dalam antrean review",
        projectId: item.projectId,
        clientName: item.clientName,
        amount: item.amount,
        submittedBy: item.submittedBy,
        timestamp: item.submittedAt,
        actionLabel: "Lihat detail",
        tag: "Menunggu",
        tagClass: "pending",
        status: "PENDING",
        targetView: "doc-gen",
        targetAction: "review_payment"
      });
    });
    pendingDept.forEach(function(item) {
      if (String(item.submittedBy || "").toLowerCase() !== myEmail) return;
      var deptLabel2 = String(item.departmentLabel || item.departmentId || "Departemen").trim();
      var prog2 = Number(item.progress || 0);
      notifications.push({
        id: "WAIT_DEPT_" + item.approvalId,
        approvalId: item.approvalId,
        type: "DEPT_WAITING",
        group: "production",
        groupLabel: "Production Ops",
        groupOrder: 1,
        category: "info",
        actionable: false,
        informational: true,
        title: "Progress " + deptLabel2 + " menunggu Direktur",
        description: "Pengajuan " + prog2 + "% · " + (item.clientName || item.projectId) + " — menunggu validasi",
        projectId: item.projectId,
        clientName: item.clientName,
        departmentId: item.departmentId,
        departmentLabel: item.departmentLabel,
        progress: prog2,
        submittedBy: item.submittedBy,
        timestamp: item.submittedAt,
        actionLabel: "Lihat detail",
        tag: "Menunggu",
        tagClass: "pending",
        status: "PENDING",
        targetView: "production-ops",
        targetAction: "review_dept"
      });
    });
  }

  // Lead / produksi / SLA
  var leadNotifs = buildLeadOpsNotifications_(leads, ctx);
  var stuckProjects = {};
  leadNotifs.forEach(function(n) {
    if (n.type === "STUCK_LEAD") stuckProjects[n.projectId] = true;
  });
  leadNotifs = leadNotifs.filter(function(n) {
    return !(n.type === "NEW_LEAD" && stuckProjects[n.projectId]);
  });
  notifications = notifications.concat(leadNotifs);

  // Apply read/dismiss state
  var inboxState = getOpsInboxState_(ctx.email);
  notifications.forEach(function(n) {
    var nid = String(n.id || "");
    n.read = !!inboxState.read[nid];
    n.dismissed = !!inboxState.dismissed[nid];
    if (n.dismissed) n.category = "done";
    else if (n.read && n.category === "info") n.category = "done";
  });

  notifications.sort(function(a, b) {
    var score = function(n) {
      var s = 0;
      if (n.actionable && !n.dismissed && !n.read) s += 100;
      if (n.actionable && !n.dismissed) s += 40;
      if (!n.informational) s += 10;
      return s;
    };
    var diff = score(b) - score(a);
    if (diff) return diff;
    return String(b.timestamp || "").localeCompare(String(a.timestamp || ""));
  });

  var approvedShown = 0;
  notifications = notifications.filter(function(n) {
    if (n.type !== "PAYMENT_APPROVED" && n.type !== "DEPT_APPROVED") return true;
    approvedShown++;
    return approvedShown <= 8;
  });

  var actionCount = notifications.filter(function(n) {
    return n.actionable && !n.dismissed && !n.read;
  }).length;

  return {
    notifications: notifications,
    rejectedForUser: rejectedForUser,
    actionCount: actionCount,
    inboxState: inboxState
  };
}

function getPendingApprovals(accessKey) {
  try {
    var ctx = requireInternalRole_(accessKey);

    // Coba serve dari cache — approval data ringan, muat dalam 1 key.
    var cached = getCache_(CACHE_KEY_APPROVALS);
    if (cached && cached._allPay) {
      var byS = function(list, s) { return list.filter(function(a) { return String(a.status || "").toUpperCase() === s; }); };
      var pending = byS(cached._allPay, "PENDING");
      var rejected = byS(cached._allPay, "REJECTED");
      var approved = byS(cached._allPay, "APPROVED");
      var pendingDept = byS(cached._allDept, "PENDING");
      var rejectedDept = byS(cached._allDept, "REJECTED");
      var approvedDept = byS(cached._allDept, "APPROVED");
      var bundle = buildOpsNotificationsForContext_(
        ctx, pending, rejected, approved, cached._leads || [], pendingDept, rejectedDept, approvedDept
      );
      var pendingForRole = filterPaymentApprovalsForRole_(pending, ctx)
      .concat(filterDeptApprovalsForRole_(pendingDept, ctx));
      return {
        success: true, role: ctx.role, fromCache: true,
        pendingCount: pendingForRole.length, actionCount: bundle.actionCount,
        notifications: (bundle.notifications || []).slice(0, 60),
        approvals: (bundle.notifications || []).slice(0, 60),
        pendingApprovals: slimApprovalListForTransport_(pendingForRole),
        rejectedApprovals: slimApprovalListForTransport_(bundle.rejectedForUser)
      };
    }

    var allPay = listPaymentApprovals_();
    var allDept = listDeptApprovals_();
    var byStatus = function(list, status) {
      return list.filter(function(a) { return String(a.status || "").trim().toUpperCase() === status; });
    };
    var pending = byStatus(allPay, "PENDING");
    var rejected = byStatus(allPay, "REJECTED");
    var approved = byStatus(allPay, "APPROVED");
    var pendingDept = byStatus(allDept, "PENDING");
    var rejectedDept = byStatus(allDept, "REJECTED");
    var approvedDept = byStatus(allDept, "APPROVED");
    var leads = loadLeadsForNotifications_();
    var bundle = buildOpsNotificationsForContext_(
      ctx, pending, rejected, approved, leads, pendingDept, rejectedDept, approvedDept
    );
    var pendingForRole = filterPaymentApprovalsForRole_(pending, ctx)
      .concat(filterDeptApprovalsForRole_(pendingDept, ctx));

    // Simpan ke cache untuk panggilan berikutnya (pending utuh + riwayat terbatas).
    putCache_(CACHE_KEY_APPROVALS, {
      _allPay: pending
        .concat(takeLastApprovals_(rejected, 40))
        .concat(takeLastApprovals_(approved, 40)),
      _allDept: pendingDept
        .concat(takeLastApprovals_(rejectedDept, 40))
        .concat(takeLastApprovals_(approvedDept, 40)),
      _leads: leads
    });

    return {
      success: true,
      role: ctx.role,
      pendingCount: pendingForRole.length,
      actionCount: bundle.actionCount,
      notifications: (bundle.notifications || []).slice(0, 60),
      approvals: (bundle.notifications || []).slice(0, 60),
      pendingApprovals: slimApprovalListForTransport_(pendingForRole),
      rejectedApprovals: slimApprovalListForTransport_(bundle.rejectedForUser)
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      pendingCount: 0,
      actionCount: 0,
      notifications: [],
      approvals: [],
      pendingApprovals: [],
      rejectedApprovals: []
    };
  }
}

function approvePaymentSubmission(accessKey, approvalId) {
  try {
    var ctx = requireDirectorRole_(accessKey);
    initializePaymentSheets_();
    var approval = getPaymentApprovalById_(approvalId);
    if (!approval) return { success: false, error: "Pengajuan tidak ditemukan." };
    if (approval.status !== "PENDING") {
      return { success: false, error: "Pengajuan ini sudah " + approval.status + "." };
    }
    assertNotSelfApprover_(ctx, approval.submittedBy);
    var result = finalizeApprovedPayment_(approval, ctx);
    if (result && result.success) {
      appendAuditLog_(
        ctx.email,
        "PAYMENT_APPROVE",
        approval.approvalId,
        "project=" + approval.projectId + ";amount=" + approval.amount + ";by=" + approval.submittedBy,
        "OK"
      );
    }
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function rejectPaymentSubmission(accessKey, approvalId, reviewNotes) {
  try {
    var ctx = requireDirectorRole_(accessKey);
    initializePaymentSheets_();
    reviewNotes = String(reviewNotes || "").trim();
    if (!reviewNotes) return { success: false, error: "Catatan reject wajib diisi." };
    var approval = getPaymentApprovalById_(approvalId);
    if (!approval) return { success: false, error: "Pengajuan tidak ditemukan." };
    if (approval.status !== "PENDING") {
      return { success: false, error: "Pengajuan ini sudah " + approval.status + "." };
    }
    updatePaymentApprovalFields_(approval.approvalId, {
      status: "REJECTED",
      reviewedBy: ctx.email,
      reviewedAt: new Date().toLocaleString("id-ID"),
      reviewNotes: reviewNotes
    });
    sendOfficerPaymentDecisionEmail_({
      decision: "REJECTED",
      approval: approval,
      reviewedBy: ctx.email,
      reviewNotes: reviewNotes
    });
    invalidateAllDataCaches_();
    appendAuditLog_(
      ctx.email,
      "PAYMENT_REJECT",
      approval.approvalId,
      "project=" + approval.projectId + ";by=" + approval.submittedBy,
      "OK"
    );
    return {
      success: true,
      approvalId: approval.approvalId,
      projectId: approval.projectId,
      status: "REJECTED",
      reviewNotes: reviewNotes
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Email ke Officer yang mengajukan, saat Direktur approve/reject.
 */
function sendOfficerPaymentDecisionEmail_(payload) {
  payload = payload || {};
  var approval = payload.approval || {};
  var officerEmail = String(approval.submittedBy || "").trim().toLowerCase();
  if (!isValidEmail_(officerEmail)) {
    Logger.log("Email keputusan payment dilewati: submittedBy tidak valid");
    return { sent: false };
  }
  // Jangan spam jika direktur yang submit sendiri (auto-approve)
  if (officerEmail === String(payload.reviewedBy || "").trim().toLowerCase()) {
    return { sent: false, reason: "same-actor" };
  }

  var decision = String(payload.decision || "").toUpperCase();
  var isApproved = decision === "APPROVED";
  var subject = isApproved
    ? "[FA Studio] Pembayaran disetujui — " + approval.projectId
    : "[FA Studio] Pembayaran ditolak — " + approval.projectId;
  var heading = isApproved ? "Pembayaran Disetujui" : "Pembayaran Ditolak — Perlu Revisi";
  var bodyLead = isApproved
    ? "Pengajuan pembayaran kamu sudah disetujui Direktur. Invoice telah dikirim ke email klien."
    : "Pengajuan pembayaran kamu ditolak Direktur. Silakan perbaiki lalu ajukan ulang di Billing.";
  var notesBlock = (!isApproved && payload.reviewNotes)
    ? "<p style='margin:16px 0;padding:14px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#991b1b;line-height:1.6'><strong>Catatan Direktur:</strong><br>" + escapeEmailHtml_(payload.reviewNotes) + "</p>"
    : "";
  var invoiceBlock = (isApproved && payload.invoiceNumber)
    ? { label: "Invoice", value: payload.invoiceNumber + (payload.invoiceUrl ? " · <a href='" + safeEmailHref_(payload.invoiceUrl) + "'>Buka PDF</a>" : ""), html: true }
    : null;
  var rows = [
    { label: "Project ID", value: normalizeProjectId_(approval.projectId) },
    { label: "Client", value: approval.clientName || "-" },
    { label: "Jumlah Diajukan", value: formatRupiahId_(approval.amount), strong: true },
    { label: "Direview oleh", value: payload.reviewedBy || "Direktur" }
  ];
  if (invoiceBlock) rows.push(invoiceBlock);

  try {
    MailApp.sendEmail({
      to: officerEmail,
      name: getMailIdentity_().name,
      replyTo: getMailIdentity_().replyTo,
      subject: subject,
      htmlBody: buildInternalEmailShellHtml_(heading, [
        "<p>Halo,</p>",
        "<p>", bodyLead, "</p>",
        buildEmailInfoTableHtml_(rows),
        notesBlock,
        "<p style='font-size:13px;color:#64748b;margin-top:18px'>Cek juga <strong>Inbox Aksi</strong> di Operation System untuk ringkasan notifikasi.</p>"
      ].join(""), isApproved ? "green" : "red")
    });
    return { sent: true, email: officerEmail };
  } catch (e) {
    Logger.log("Email keputusan ke officer gagal: " + e.message);
    return { sent: false, reason: e.message };
  }
}

/** @deprecated Use submitPaymentForReview — kept as alias for older clients */
function generateInvoiceForProject(accessKey, invoiceData) {
  return submitPaymentForReview(accessKey, invoiceData);
}

function logPaymentStatusChange_(paymentId, oldStatus, newStatus, changedBy, notes) {
  initializePaymentSheets_();
  var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
  var sheet = ss.getSheetByName(CONFIG.SHEET_PAY_HIST);
  sheet.appendRow([
    new Date().toLocaleString("id-ID"),
    paymentId,
    oldStatus,
    newStatus,
    changedBy,
    notes || ""
  ]);
}

function saveInvoiceToDrive_(projectId, pdfBlob) {
  try {
    if (!projectId) {
      var root = DriveApp.getFolderById(getConfig_("DRIVE_FOLDER_ID"));
      var rootFile = root.createFile(pdfBlob);
      logDriveAsset_(projectId || "", "INVOICE_PDF", rootFile.getUrl(), rootFile.getId(), rootFile.getName(), "PaymentInvoices");
      return rootFile.getUrl();
    }

    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
    if (!leadsSheet) {
      var rootFolder = DriveApp.getFolderById(getConfig_("DRIVE_FOLDER_ID"));
      var fallbackRootFile = rootFolder.createFile(pdfBlob);
      logDriveAsset_(projectId, "INVOICE_PDF", fallbackRootFile.getUrl(), fallbackRootFile.getId(), fallbackRootFile.getName(), "PaymentInvoices");
      return fallbackRootFile.getUrl();
    }

    var data = leadsSheet.getDataRange().getValues();
    var driveUrl = "";
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === projectId) {
        driveUrl = data[i][4] || "";
        break;
      }
    }

    if (driveUrl) {
      var folderId = driveUrl.split("/folders/")[1];
      if (folderId) {
        var folder = DriveApp.getFolderById(folderId.split("?")[0]);
        var invoiceFile = folder.createFile(pdfBlob);
        logDriveAsset_(projectId, "INVOICE_PDF", invoiceFile.getUrl(), invoiceFile.getId(), invoiceFile.getName(), "PaymentInvoices");
        return invoiceFile.getUrl();
      }
    }

    var fallback = DriveApp.getFolderById(getConfig_("DRIVE_FOLDER_ID"));
    var fallbackFile = fallback.createFile(pdfBlob);
    logDriveAsset_(projectId, "INVOICE_PDF", fallbackFile.getUrl(), fallbackFile.getId(), fallbackFile.getName(), "PaymentInvoices");
    return fallbackFile.getUrl();
  } catch (e) {
    Logger.log("Save invoice to Drive gagal: " + e.message);
    return "";
  }
}

function getProjectDriveFolder_(projectId) {
  try {
    var ss = SpreadsheetApp.openById(getConfig_("SHEET_ID"));
    var leadsSheet = ss.getSheetByName(CONFIG.SHEET_LEADS);
    if (leadsSheet && projectId) {
      var data = leadsSheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === projectId && data[i][4]) {
          var folderId = String(data[i][4]).split("/folders/")[1];
          if (folderId) return DriveApp.getFolderById(folderId.split("?")[0]);
        }
      }
    }
  } catch (e) {
    Logger.log("Project folder tidak ditemukan: " + e.message);
  }
  return DriveApp.getFolderById(getConfig_("DRIVE_FOLDER_ID"));
}

/**
 * Folder bukti transfer: di luar folder project klien (klien viewer tidak bisa melihat).
 * Path: DRIVE_PORTAL / _Internal_Payment_Proofs / {projectId}
 */
function getInternalPaymentProofsRootFolder_() {
  var root = DriveApp.getFolderById(getConfig_("DRIVE_FOLDER_ID"));
  var folderName = "_Internal_Payment_Proofs";
  var it = root.getFoldersByName(folderName);
  var folder = it.hasNext() ? it.next() : root.createFolder(folderName);
  try {
    folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  } catch (eShare) {
    Logger.log("getInternalPaymentProofsRootFolder_ setSharing: " + eShare.message);
  }
  getInternalDriveEmails_().forEach(function(email) {
    addFolderEditorIfNeeded_(folder, email);
  });
  return folder;
}

function getInternalProofFolderForProject_(projectId) {
  var root = getInternalPaymentProofsRootFolder_();
  var pid = String(normalizeProjectId_(projectId) || "unknown").replace(/^#/, "") || "unknown";
  var it = root.getFoldersByName(pid);
  if (it.hasNext()) return it.next();
  return root.createFolder(pid);
}

function sanitizeProofFileName_(name) {
  var raw = String(name || "bukti-transfer").split(/[/\\]/).pop() || "bukti-transfer";
  raw = raw.replace(/\0/g, "").replace(/[^\w.\-]+/g, "_").replace(/^\.+/, "");
  if (raw.length > 80) {
    var ext = "";
    var dot = raw.lastIndexOf(".");
    if (dot > 0) ext = raw.slice(dot).slice(0, 8);
    raw = raw.slice(0, 80 - ext.length) + ext;
  }
  return raw || "bukti-transfer";
}

function sniffProofMimeFromBytes_(bytes) {
  if (!bytes || bytes.length < 8) return "";
  function b(i) { var v = bytes[i]; return v < 0 ? v + 256 : v; }
  if (b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46) return "application/pdf";
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4E && b(3) === 0x47) return "image/png";
  if (b(0) === 0xFF && b(1) === 0xD8 && b(2) === 0xFF) return "image/jpeg";
  return "";
}

function buildProofBlob_(proofFile, projectId, paymentId) {
  if (!proofFile || !proofFile.data) return null;
  var bytes = Utilities.base64Decode(proofFile.data);
  var sniffed = sniffProofMimeFromBytes_(bytes);
  var mimeType = sniffed || "application/octet-stream";
  var safeName = sanitizeProofFileName_(proofFile.name || "bukti-transfer");
  var ext = mimeType === "application/pdf" ? ".pdf" : (mimeType === "image/png" ? ".png" : ".jpg");
  if (!/\.(pdf|png|jpe?g)$/i.test(safeName)) safeName += ext;
  return Utilities.newBlob(
    bytes,
    mimeType,
    "Bukti_Transfer_" + String(projectId || "").replace("#", "") + "_" + paymentId + "_" + safeName
  );
}

function validateProofFile_(proofFile) {
  var data = String((proofFile && proofFile.data) || "");
  if (!data) {
    return { success: false, error: "Bukti transfer kosong atau gagal dibaca." };
  }
  var approxBytes = Math.ceil(data.length * 3 / 4);
  if (approxBytes > 8 * 1024 * 1024) {
    return { success: false, error: "Ukuran bukti transfer maksimal 8MB." };
  }

  var nameCheck = inspectProofFileName_(proofFile && proofFile.name);
  if (!nameCheck.ok) return { success: false, error: nameCheck.error };

  var bytes;
  try {
    bytes = Utilities.base64Decode(data);
  } catch (e) {
    return { success: false, error: "Bukti transfer rusak atau tidak bisa dibaca." };
  }
  var sniffed = sniffProofMimeFromBytes_(bytes);
  if (!sniffed) {
    return { success: false, error: "Isi file bukan PDF/JPG/PNG yang valid." };
  }
  var claimed = String((proofFile && proofFile.mimeType) || "").toLowerCase();
  if (claimed === "image/jpg") claimed = "image/jpeg";
  if (claimed && claimed !== "application/octet-stream" && claimed !== sniffed) {
    return { success: false, error: "Tipe file tidak sesuai isinya. Gunakan PDF, JPG, atau PNG asli." };
  }
  var ext = nameCheck.ext;
  if ((sniffed === "application/pdf" && ext !== "pdf")
      || (sniffed === "image/png" && ext !== "png")
      || (sniffed === "image/jpeg" && ext !== "jpg" && ext !== "jpeg")) {
    return { success: false, error: "Ekstensi file tidak sesuai isinya." };
  }
  proofFile.mimeType = sniffed;
  proofFile.name = sanitizeProofFileName_(proofFile.name);
  return { success: true, mimeType: sniffed, safeName: proofFile.name };
}

function inspectProofFileName_(name) {
  var raw = String(name || "");
  if (!raw) return { ok: false, error: "Nama file bukti transfer kosong." };
  if (/[\\/]/.test(raw) || raw.indexOf("..") >= 0 || raw.indexOf("\0") >= 0) {
    return { ok: false, error: "Nama file bukti transfer tidak valid." };
  }
  if (raw.length > 120) {
    return { ok: false, error: "Nama file bukti transfer terlalu panjang." };
  }
  var lowered = raw.toLowerCase();
  if (/\.(php|exe|js|html|htm|svg|xml|sh|bat|cmd|scr)(\.|$)/.test(lowered)) {
    return { ok: false, error: "Nama file bukti transfer mengandung ekstensi yang tidak diizinkan." };
  }
  var match = lowered.match(/\.([a-z0-9]+)$/);
  var ext = match ? match[1] : "";
  if (ext !== "pdf" && ext !== "png" && ext !== "jpg" && ext !== "jpeg") {
    return { ok: false, error: "Format bukti transfer tidak valid. Gunakan PDF, JPG, atau PNG." };
  }
  return { ok: true, ext: ext };
}

function saveTransferProofToDrive_(projectId, paymentId, proofFile) {
  var proofBlob = buildProofBlob_(proofFile, projectId, paymentId);
  if (!proofBlob) return { blob: null, url: "" };

  try {
    // Jangan simpan di folder project klien — klien bisa lihat sebagai viewer.
    var folder = getInternalProofFolderForProject_(projectId);
    var file = folder.createFile(proofBlob);
    logDriveAsset_(projectId, "TRANSFER_PROOF", file.getUrl(), file.getId(), file.getName(), "PaymentInvoices");
    return { blob: proofBlob, url: file.getUrl() };
  } catch (e) {
    Logger.log("Save bukti transfer gagal: " + e.message);
    return { blob: proofBlob, url: "" };
  }
}

function sendInvoiceInternalNotification_(payment, invoiceNumber, invoiceUrl, pdfBlob, proofBlob, proofUrl) {
  try {
    var attachments = [pdfBlob];
    if (proofBlob) attachments.push(proofBlob);
    var safeInvoiceHref = safeEmailHref_(invoiceUrl);
    var safeProofHref = safeEmailHref_(proofUrl);
    var rows = [
      { label: "Invoice", value: invoiceNumber || "-" },
      { label: "Project ID", value: normalizeProjectId_(payment.projectId) },
      { label: "Client", value: payment.clientName || "-" },
      { label: "Email Client", value: payment.clientEmail || "-" },
      { label: "Pembayaran Kali Ini", value: formatRupiahId_(payment.currentAmount || payment.amount), strong: true },
      { label: "Total Tervalidasi", value: formatRupiahId_(payment.totalPaid || payment.amount) },
      { label: "Status Payment", value: formatEmailPaymentStatusLabel_(payment.paymentStatus), strong: true }
    ];
    if (payment.projectTotal) {
      rows.push({ label: "Total Project", value: formatRupiahId_(payment.projectTotal) });
      rows.push({ label: "Sisa Pembayaran", value: formatRupiahId_(payment.remainingAmount || 0) });
    }
    rows.push({
      label: "Invoice PDF",
      value: invoiceUrl ? "<a href='" + safeInvoiceHref + "'>Buka Invoice</a>" : "-",
      html: true
    });
    rows.push({
      label: "Bukti Transfer",
      value: proofUrl ? "<a href='" + safeProofHref + "'>Buka Bukti Transfer</a>" : "Terlampir",
      html: !!proofUrl
    });

    MailApp.sendEmail({
      to: CONFIG.EMAIL_FROM,
      name: getMailIdentity_().name,
      replyTo: getMailIdentity_().replyTo,
      subject: "[FA Studio] Invoice Terkirim & Bukti Transfer — " + invoiceNumber,
      htmlBody: buildInternalEmailShellHtml_("Invoice Berhasil Dikirim ke Client", [
        buildEmailInfoTableHtml_(rows),
        "<p style='margin-top:16px;font-size:13px;color:#64748b'>Invoice PDF dan bukti transfer terlampir di email ini.</p>"
      ].join("")),
      attachments: attachments
    });
  } catch (e) {
    Logger.log("Email notifikasi invoice internal gagal: " + e.message);
  }
}

function getCompanyLogoSrc_() {
  if (CONFIG.COMPANY_LOGO_BASE64) {
    return "data:image/png;base64," + CONFIG.COMPANY_LOGO_BASE64;
  }

  try {
    if (getConfig_("COMPANY_LOGO_FILE_ID")) {
      var blob = DriveApp.getFileById(getConfig_("COMPANY_LOGO_FILE_ID")).getBlob();
      return "data:" + blob.getContentType() + ";base64," + Utilities.base64Encode(blob.getBytes());
    }
  } catch (e) {
    Logger.log("Logo invoice gagal dimuat dari Drive: " + e.message);
  }
  return CONFIG.COMPANY_LOGO_URL || "";
}

function buildInvoiceHTML_(payment, invoiceNumber) {
  var fmt = function(n) {
    return "Rp " + Number(n).toLocaleString("id-ID");
  };

  var logoSrc = getCompanyLogoSrc_();
  var cleanInvoiceNumber = invoiceNumber.replace(/\//g, "-");
  var currentAmount = Number(payment.currentAmount || payment.amount || 0);
  var previousTotal = Number(payment.previousTotal || 0);
  var totalPaid = Number(payment.totalPaid || payment.amount || 0);
  var projectTotal = Number(payment.projectTotal || 0);
  var remainingAmount = projectTotal ? Number(payment.remainingAmount || 0) : 0;
  var itemDescription = payment.category
    ? payment.category
    : "Pembayaran Project " + (payment.projectId || payment.clientName);

  var validatedDate = payment.validatedAt
    ? String(payment.validatedAt)
    : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  var paymentDateStr = payment.paymentDate
    ? (payment.paymentDate instanceof Date
        ? payment.paymentDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
        : String(payment.paymentDate))
    : "-";

  return [
    "<!DOCTYPE html><html><head><meta charset='UTF-8'>",
    "<style>",
    "@page{size:A4;margin:0}",
    "*{box-sizing:border-box}",
    "body{margin:0;background:#fff;color:#23252f;font-family:Arial,'Helvetica Neue',sans-serif;font-size:11px}",
    ".page{width:735px;margin:0 auto;background:#fff;overflow:hidden}",
    ".top{display:table;width:100%;padding:26px 38px 24px;border-bottom:1px solid #e7e7ea}",
    ".brand,.company{display:table-cell;width:50%;vertical-align:top}",
    ".company{text-align:right;color:#5f6270;font-size:11px;line-height:1.38}",
    ".company h2{margin:0 0 5px;color:#23252f;font-size:18px;font-weight:400}",
    ".logo{display:block;width:220px;height:auto;max-height:58px;margin:0 0 9px 0}",
    ".fallback-logo{font-size:34px;font-weight:800;letter-spacing:-1px;color:#111;margin-bottom:9px}",
    ".invoice-no{font-size:12px;color:#6f7280;letter-spacing:.01em}",
    ".meta{display:table;width:100%;padding:26px 38px 32px}",
    ".billto,.dates{display:table-cell;width:50%;vertical-align:top}",
    ".dates{text-align:right}",
    ".label{font-size:10px;text-transform:uppercase;letter-spacing:.13em;color:#7c7f8e;margin-bottom:9px;font-weight:700}",
    ".client{font-size:15px;font-weight:700;color:#20232d;margin-bottom:6px}",
    ".muted{color:#777b88;line-height:1.4}",
    ".date-block{margin-bottom:14px}.date-val{font-size:13px;color:#20232d;margin-top:4px}",
    ".items{padding:0 38px 0;overflow:hidden}",
    "table{width:100%;border-collapse:collapse}",
    ".items th{text-align:left;padding:0 0 10px;border-bottom:1px solid #e7e7ea;color:#737684;font-size:10px;text-transform:uppercase;letter-spacing:.12em}",
    ".items td{padding:14px 0;border-bottom:1px solid #f0f1f3;font-size:12px;color:#2b2e38;vertical-align:top}",
    ".right{text-align:right}.center{text-align:center}",
    ".desc{width:43%}.qty{width:10%}.price{width:22%}.sum{width:25%}",
    ".desc-cell{max-width:300px;word-break:break-word;line-height:1.35;padding-right:16px!important}",
    ".spacer{height:82px}",
    ".summary-wrap{display:table;width:100%;padding:0 38px 22px}",
    ".summary-left,.summary{display:table-cell;vertical-align:bottom}",
    ".summary-left{width:54%}",
    ".summary{width:46%;font-size:12px;color:#383b46}",
    ".summary-row{display:table;width:100%;padding:5px 0}",
    ".summary-label,.summary-value{display:table-cell}",
    ".summary-value{text-align:right}",
    ".divider{height:1px;background:#e7e7ea;margin:4px 0 7px}",
    ".grand{font-weight:800;font-size:17px;color:#20232d;padding-top:6px}",
    ".grand .summary-label{font-size:12px;text-transform:uppercase;letter-spacing:.04em}",
    ".grand .summary-value{color:#111827}",
    ".footer{border-top:1px solid #e7e7ea;background:#fafafa;padding:18px 38px 20px;color:#5f6270;line-height:1.45;font-size:11px}",
    ".footer .label{margin-bottom:7px}",
    ".verify{font-size:9px;color:#7c7f8e;margin-top:8px}",
    "</style></head><body>",
    "<div class='page'>",
    "<div class='top'>",
    "<div class='brand'>",
    logoSrc
      ? "<img class='logo' src='" + logoSrc + "' alt='FA Studio'>"
      : "<div class='fallback-logo'>FASTUDIO</div>",
    "<div class='invoice-no'>", cleanInvoiceNumber, "</div>",
    "</div>",
    "<div class='company'>",
    "<h2>", CONFIG.COMPANY_NAME, "</h2>",
    "<div>", CONFIG.COMPANY_ADDRESS, "</div>",
    "<div style='margin-top:8px'>", CONFIG.COMPANY_PHONE, "</div>",
    "<div>", CONFIG.COMPANY_EMAIL, "</div>",
    "</div>",
    "</div>",
    "<div class='meta'>",
    "<div class='billto'>",
    "<div class='label'>Kepada</div>",
    "<div class='client'>", payment.clientName, "</div>",
    "<div class='muted'>Project ID: ", payment.projectId || "-", "</div>",
    "<div class='muted'>Payment ID: ", payment.paymentId || "-", "</div>",
    "</div>",
    "<div class='dates'>",
    "<div class='date-block'><div class='label'>Tanggal Invoice</div><div class='date-val'>", validatedDate, "</div></div>",
    "<div class='date-block'><div class='label'>Tanggal Transfer</div><div class='date-val'>", paymentDateStr, "</div></div>",
    "</div>",
    "</div>",
    "<div class='items'>",
    "<table>",
    "<tr><th class='desc'>Deskripsi</th><th class='qty center'>Qty</th><th class='price right'>Harga</th><th class='sum right'>Jumlah</th></tr>",
    "<tr>",
    "<td class='desc-cell'>", itemDescription, "<br><span class='muted'>Pembayaran ke-", (payment.invoiceSequence || "1"), " · ", payment.paymentMethod || "-", "</span></td>",
    "<td class='center'>1</td>",
    "<td class='right'>", fmt(currentAmount), "</td>",
    "<td class='right'>", fmt(currentAmount), "</td>",
    "</tr>",
    "</table>",
    "</div>",
    "<div class='spacer'></div>",
    "<div class='summary-wrap'>",
    "<div class='summary-left'></div>",
    "<div class='summary'>",
    "<div class='summary-row'><div class='summary-label'>Pembayaran Kali Ini</div><div class='summary-value'>", fmt(currentAmount), "</div></div>",
    "<div class='summary-row'><div class='summary-label'>Total Sebelumnya</div><div class='summary-value'>", fmt(previousTotal), "</div></div>",
    projectTotal ? "<div class='summary-row'><div class='summary-label'>Total Project</div><div class='summary-value'>" + fmt(projectTotal) + "</div></div>" : "",
    "<div class='divider'></div>",
    "<div class='summary-row grand'><div class='summary-label'>Total Tervalidasi</div><div class='summary-value'>", fmt(totalPaid), "</div></div>",
    projectTotal ? "<div class='summary-row'><div class='summary-label'>Sisa Pembayaran</div><div class='summary-value'>" + fmt(remainingAmount) + "</div></div>" : "",
    "</div>",
    "</div>",
    "<div class='footer'>",
    "<div class='label'>Catatan</div>",
    "<div>", CONFIG.PAYMENT_NOTE, "</div>",
    "<div>Terima kasih atas kepercayaan Anda.</div>",
    "<div class='verify'>Invoice ini dibuat otomatis oleh FA Studio Portal dan pembayaran telah divalidasi oleh Tim Internal FA Studio.</div>",
    "</div>",
    "</div>",
    "</body></html>"
  ].join("");
}

function buildInvoiceEmailBody_(payment, invoiceNumber, invoiceUrl) {
  var rows = [
    { label: "No. Invoice", value: invoiceNumber || "-" },
    { label: "Project ID", value: normalizeProjectId_(payment.projectId) },
    { label: "Payment ID", value: payment.paymentId || "-" },
    { label: "Pembayaran Kali Ini", value: formatRupiahId_(payment.currentAmount || payment.amount), strong: true },
    { label: "Total Tervalidasi", value: formatRupiahId_(payment.totalPaid || payment.amount) },
    { label: "Status Payment", value: formatEmailPaymentStatusLabel_(payment.paymentStatus), strong: true }
  ];
  if (payment.projectTotal) {
    rows.push({ label: "Total Project", value: formatRupiahId_(payment.projectTotal) });
    rows.push({ label: "Sisa Pembayaran", value: formatRupiahId_(payment.remainingAmount || 0) });
  }

  return buildClientEmailShellHtml_("Invoice Pembayaran", "purple", [
    "<p>Halo ", escapeEmailHtml_(payment.clientName), ",</p>",
    "<p>Pembayaran kamu telah diverifikasi. Invoice resmi terlampir dalam email ini.</p>",
    buildEmailInfoTableHtml_(rows),
    invoiceUrl ? "<p style='font-size:13px;color:#64748b;margin-top:16px'>Salinan PDF juga tersimpan di: <a href='" + safeEmailHref_(invoiceUrl) + "'>Google Drive</a></p>" : "",
    "<p style='font-size:13px;color:#64748b;margin-top:16px;line-height:1.6'>Terima kasih atas kepercayaan kamu kepada FA Studio Indonesia.</p>",
    buildEmailPortalCtaHtml_("Lihat Riwayat Pembayaran")
  ].join(""));
}
