import os
import shutil
import time

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


class DirectoryManager:
    def __init__(self):
        self.left_dir = os.getcwd()
        self.right_dir = os.getcwd()

    def change_left_dir(self, dir_):
        try:
            os.chdir(dir_)
            self.left_dir = os.getcwd()
            return self.left_dir
        except Exception as e:
            print(e)

    def change_right_dir(self, dir_):
        os.chdir(dir_)
        self.right_dir = os.getcwd()
        return self.right_dir


directory_manager = DirectoryManager()


@app.route('/')
def slash():
    return ' '.join([directory_manager.left_dir, directory_manager.right_dir])


@app.route('/go_back_left')
def go_back_left():
    new_dir = os.path.dirname(directory_manager.left_dir)
    directory_manager.change_left_dir(new_dir)
    return jsonify(os.listdir(new_dir))


@app.route('/go_back_right')
def go_back_right():
    new_dir = os.path.dirname(directory_manager.right_dir)
    directory_manager.change_right_dir(new_dir)
    return jsonify(os.listdir(new_dir))


@app.route('/list_left_dir')
def list_left_dir():
    contents = []
    for item in os.listdir(directory_manager.left_dir):
        item_path = os.path.join(directory_manager.left_dir, item)
        stats = os.stat(item_path)
        creation_time = time.ctime(stats.st_ctime)  # or use st_mtime for last modified time
        size = '<DIR>' if os.path.isdir(item_path) else stats.st_size

        contents.append({
            "name": item,
            "creation_time": creation_time,
            "size": size
        })
    return jsonify(contents)


@app.route('/list_right_dir')
def list_right_dir():
    contents = []
    for item in os.listdir(directory_manager.right_dir):
        item_path = os.path.join(directory_manager.right_dir, item)
        stats = os.stat(item_path)
        creation_time = time.ctime(stats.st_ctime)  # or use st_mtime for last modified time
        size = '<DIR>' if os.path.isdir(item_path) else stats.st_size

        contents.append({
            "name": item,
            "creation_time": creation_time,
            "size": size
        })
    return jsonify(contents)


@app.route('/change_left_dir', methods=['POST'])
def change_left_dir():
    try:
        dir_name = request.json.get('dir_name')
        new_dir = os.path.join(directory_manager.left_dir, dir_name)
        directory_manager.change_left_dir(new_dir)
        return jsonify(os.listdir(new_dir))
    except Exception as e:
        raise e


@app.route('/change_right_dir', methods=['POST'])
def change_right_dir():
    dir_name = request.json.get('dir_name')
    new_dir = os.path.join(directory_manager.right_dir, dir_name)
    directory_manager.change_right_dir(new_dir)
    return jsonify(os.listdir(new_dir))


@app.route('/get_current_left_path')
def get_current_left_path():
    return jsonify(directory_manager.left_dir)


@app.route('/get_current_right_path')
def get_current_right_path():
    return jsonify(directory_manager.right_dir)


@app.route('/copy_file', methods=['POST'])
def copy_file():
    data = request.json
    filename = data['filename']

    source_dir = directory_manager.left_dir  # or use an identifier to choose the directory
    destination_dir = directory_manager.right_dir  # or use an identifier

    if 'right' in data['dir']:
        source_dir = directory_manager.right_dir  # or use an identifier to choose the directory
        destination_dir = directory_manager.left_dir  # or use an identifier

    source_path = os.path.join(source_dir, filename)
    destination_path = os.path.join(destination_dir, filename)

    try:

        if os.path.isdir(source_path):
            shutil.copytree(source_path, destination_path)
        else:
            shutil.copy(source_path, destination_path)

        return jsonify({"message": "File copied successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/move_file', methods=['POST'])
def move_file():
    data = request.json
    item_name = data['filename']  # Could be a file or directory

    source_dir = directory_manager.left_dir
    destination_dir = directory_manager.right_dir

    if 'right' in data['dir']:
        source_dir = directory_manager.right_dir
        destination_dir = directory_manager.left_dir

    source_path = os.path.join(source_dir, item_name)
    destination_path = os.path.join(destination_dir, item_name)

    try:
        if os.path.isdir(source_path):
            shutil.copytree(source_path, destination_path)
            shutil.rmtree(source_path)
        else:
            shutil.move(source_path, destination_path)

        return jsonify({"message": "Item moved successfully"}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


@app.route('/delete_file', methods=['POST'])
def delete_file():
    data = request.json
    filename = data['filename']
    dir_identifier = data['dir']

    # Determine the directory
    directory = directory_manager.left_dir if dir_identifier == 'left' else directory_manager.right_dir

    file_path = os.path.join(directory, filename)

    try:
        if os.path.isfile(file_path):
            os.remove(file_path)
        elif os.path.isdir(file_path):
            shutil.rmtree(file_path)  # Use rmtree for directories
        else:
            return jsonify({"error": "File not found"}), 404
        return jsonify({"message": "File deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.debug = True
    app.run(host='127.0.0.1', port=8080)
