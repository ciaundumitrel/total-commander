from paste import httpserver


def app(environ, start_response):
    start_response('200 OK', [('content-type', 'text/html')])
    return [b'Hello world!']


if __name__ == "__main__":
    httpserver.serve(app, host='127.0.0.1', port='8080')
