import urllib.request, sys, time

# small delay to let server bind
time.sleep(1)
try:
    resp = urllib.request.urlopen('http://127.0.0.1:5000/api/health', timeout=5)
    print(resp.status)
    print(resp.read().decode())
except Exception as e:
    print('error', e)
    sys.exit(1)
