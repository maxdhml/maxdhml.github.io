# Test Article - TryHackMe Room

Ceci est un article de test pour vérifier le nouveau système Markdown.

## Reconnaissance

On commence par un scan nmap :

```bash
nmap -sV -sC 10.10.10.1
```

Résultat :
- Port 22 : SSH
- Port 80 : HTTP (Apache)
- Port 443 : HTTPS

## Exploitation

On utilise `gobuster` pour énumérer les répertoires :

```bash
gobuster dir -u http://10.10.10.1 -w /usr/share/wordlists/dirb/common.txt
```

> **Note** : Toujours vérifier les headers HTTP pour des indices supplémentaires.

## Conclusion

Cette room nous a permis de pratiquer :
1. L'énumération de services
2. L'exploitation web
3. L'escalade de privilèges

| Outil | Usage |
|-------|-------|
| nmap | Scan de ports |
| gobuster | Énumération de répertoires |
| linpeas | Privesc |
