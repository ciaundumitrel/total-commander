import './App.css';
import {useEffect, useState} from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faMusic, faFilm, faImage, faFolder} from '@fortawesome/free-solid-svg-icons';


const getFileIcon = (filename) => {
  try {
    let extension= null;
    if (filename.includes('.')){
      extension = filename.split('.').pop().toLowerCase();
    }
    switch (extension) {
      case 'mp3':
      case 'wav':
        return faMusic;
      case 'jpg':
      case 'png':
      case 'gif':
        return faImage;
      case 'mp4':
      case 'avi':
        return faFilm;

      case null:
        return faFolder;

      default:
        return faFile; // Default file icon
    }
  }
  catch(e){
    console.log(e);
  }
};

const SERVER = 'http://127.0.0.1:8080'

function App() {
  const [leftDirContents, setLeftDirContents] = useState([]);
  const [rightDirContents, setRightDirContents] = useState([]);
  const [leftCurrentPath, setLeftCurrentPath] = useState("");
  const [rightCurrentPath, setRightCurrentPath] = useState("");
  const [leftSelectedItems, setLeftSelectedItems] = useState([]);
  const [rightSelectedItems, setRightSelectedItems] = useState([]);
  const [activePane, setActivePane] = useState(null);
  const [newName, setNewName] = useState('');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState('file'); // or 'folder'
  const [newItemName, setNewItemName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');

  const handlePaneClick = (pane) => {
    setActivePane(pane);
  };

  useEffect(() => {
    fetchLeftDirContents();
    fetchRightDirContents();
    fetchInitialPaths();
  }, []);

  const selectLeftItem = (item, isCtrlPressed) => {
    handlePaneClick('left');
    setRightSelectedItems([]);
    setLeftSelectedItems(prevSelected => {
      if (isCtrlPressed) {
        return prevSelected.includes(item) ? prevSelected.filter(i => i !== item) : [...prevSelected, item];
      } else {
        return [item];
      }
    });
  };

  const selectRightItem = (item, isCtrlPressed) => {
  handlePaneClick('right');
  setLeftSelectedItems([]);
  setRightSelectedItems(prevSelected => {
    if (isCtrlPressed) {
      return prevSelected.includes(item) ? prevSelected.filter(i => i !== item) : [...prevSelected, item];
    } else {
      return [item];
    }
  });
  };

  const fetchLeftDirContents = async () => {
    const response = await fetch(SERVER + '/list_left_dir');
    const data = await response.json();
    setLeftDirContents(data);
  };

  const fetchRightDirContents = async () => {
    const response = await fetch(SERVER + '/list_right_dir');
    const data = await response.json();
    setRightDirContents(data);
  };
  const goBackLeftDir = async () => {
    const response = await fetch(SERVER + '/go_back_left');
    const data = await response.json();
    setLeftDirContents(data);
    fetchLeftDirContents();
    fetchInitialPaths();
  };

  const goBackRightDir = async () => {
    const response = await fetch(SERVER + '/go_back_right');
    const data = await response.json();
    setRightDirContents(data);
    fetchRightDirContents();
    fetchInitialPaths();
  };

   const changeLeftDir = async (dirName) => {
    const response = await fetch(SERVER + '/change_left_dir', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dir_name: dirName }),
    });
    const data = await response.json();
    setLeftDirContents(data);
    fetchLeftDirContents();
    fetchInitialPaths();
  };

  const changeRightDir = async (dirName) => {
    const response = await fetch(SERVER + '/change_right_dir', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dir_name: dirName }),
    });
    const data = await response.json();
    fetchRightDirContents();
    fetchInitialPaths();

  };
  const fetchInitialPaths = async () => {
    try {
      const responseLeft = await fetch(SERVER + '/get_current_left_path');
      const leftPath = await responseLeft.json();
      setLeftCurrentPath(leftPath);

      const responseRight = await fetch(SERVER + '/get_current_right_path');
      const rightPath = await responseRight.json();
      setRightCurrentPath(rightPath);
    } catch (error) {
      console.error("Error fetching initial paths:", error);
    }
  };

  const handleRenameOperation = async () => {
    let selectedItems = leftSelectedItems;
    let dir = 'left';

    if (selectedItems.length === 0){
      selectedItems = rightSelectedItems;
      dir = 'right';
    }
    for (const item of selectedItems) {
      try {
        const response = await fetch(SERVER + '/rename', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({filename: item.name, dir: dir, newname: newName}),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Operation failed');
        }
      } catch (error) {
        return;
      }
    }
    fetchLeftDirContents();
    fetchRightDirContents();
    setIsRenameDialogOpen(false);
    setNewName('');
  }

  const handleFileOperation = async (operation) => {
    let endpoint = operation === 'copy' ? '/copy_file' : '/move_file';
    if (operation === 'delete'){
      endpoint = '/delete_file';
    }
    let selectedItems = leftSelectedItems;
    let dir = 'left';
    if (selectedItems.length === 0){
      selectedItems = rightSelectedItems;
      dir = 'right';
    }
    for (const item of selectedItems) {
      try {
        const response = await fetch(SERVER + endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filename: item.name, dir:dir}),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Operation failed');
        }
      } catch (error) {
        console.error(`Error during ${operation}:`, error);
        alert(`Error during ${operation}: ${error.message}`);
        return;
      }
    }
    fetchLeftDirContents();
    fetchRightDirContents();
  };


function formatBytes(bytes, decimals = 2) {
  if (bytes === '<DIR>'){
    return bytes
  }
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

  const openCreateFileDialog = () => {
    setCreateType('file');
    setIsCreateDialogOpen(true);
  };

  const openCreateFolderDialog = () => {
    setCreateType('folder');
    setIsCreateDialogOpen(true);
  };

 const handleCreateSubmit = async () => {
  // Close the dialog
  setIsCreateDialogOpen(false);

  const data = {
    dir: activePane,
    type: createType, // 'file' or 'folder'
    name: newItemName, // The name entered by the user
  };

  try {
    // Send the request to your server endpoint
    const response = await fetch(SERVER + '/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Server responded with an error.');
    }

    // Parse the JSON response (if expecting a response)
    const result = await response.json();

    // Update your application state as necessary
    // For example, refresh the file list to show the new file/folder
  } catch (error) {
    console.error('Error creating file/folder:', error);
    // Handle errors (e.g., show an error message to the user)
  }

  // Reset the dialog input field
  setNewItemName('');
  fetchLeftDirContents();
  fetchRightDirContents();
};
const openEditDialog = async () => {
  let selectedItem;
  if (rightSelectedItems.length === 0 && leftSelectedItems.length === 1) {
    selectedItem = leftSelectedItems[0];
  } else if (leftSelectedItems.length === 0 && rightSelectedItems.length === 1) {
    selectedItem = rightSelectedItems[0];
  } else {
    // Handle case where no file or more than one file is selected
    console.error('Please select a single file to edit');
    return;
  }

  setEditingFile(selectedItem); // Setting the selectedItem as editingFile

  try {
    const response = await fetch(`${SERVER}/get_file_content?filename=${selectedItem.name}&dir=${activePane}`);
    if (!response.ok) {
      throw new Error('File content could not be fetched.');
    }
    const content = await response.text();
    setFileContent(content);
    setIsEditDialogOpen(true);
  } catch (error) {
    console.error('Error fetching file content:', error);
  }
};
  const handleSaveFile = async () => {
  try {
    const response = await fetch('http://127.0.0.1:8080/save_file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename: editingFile.name, content: fileContent }),
    });

    if (!response.ok) {
      throw new Error('Error saving file.');
    }
    setIsEditDialogOpen(false);
    fetchLeftDirContents();
    fetchRightDirContents();
  } catch (error) {
    console.error('Error saving file:', error);
  }
};
  return (
    <div className="App">
      <div className="pane-container">
      <div onClick = {() => {handlePaneClick('left')}}  className={`pane left-pane ${activePane === 'left' ? 'active-pane' : ''}`}>
      <div>Current Path: {leftCurrentPath}</div>
      <button onClick={goBackLeftDir}>Go Back</button>
        <table className={activePane === 'left' ? 'active-table' : ''}>
          <thead>
          <tr>
            <th>Name</th>
            <th>Created</th>
            <th>Size</th>
          </tr>
          </thead>
          <tbody>
          {leftDirContents.map((item, index) => (
              <tr key={index}
                  onDoubleClick={() => changeLeftDir(item.name)}
                  onClick={(e) => selectLeftItem(item, e.ctrlKey)}
                  className={leftSelectedItems.includes(item) && activePane === 'left' ? 'selected' : ''}>
                <td>
                  <FontAwesomeIcon icon={getFileIcon(item.name)} /> {/* Display icon */}
                  {item.name}</td>
                <td>{item.creation_time}</td>
                <td>{formatBytes(item.size)}</td>
              </tr>
          ))}
          </tbody>
        </table>
      </div>
        <div className="mid-pane">
          <div className="buttons-container">
            <button onClick={() => handleFileOperation('copy')}>Copy</button>
            <button onClick={() => handleFileOperation('cut')}>Cut</button>
            <button onClick={() => handleFileOperation('delete')}>Delete</button>
            <button onClick={() => openEditDialog()}>Edit</button>

            <button onClick={() => setIsRenameDialogOpen(true)}>Rename</button>

            <button onClick={openCreateFileDialog}>Create File</button>
            <button onClick={openCreateFolderDialog}>Create Folder</button>
          </div>
        </div>
        <div onClick={() => {
          handlePaneClick('right')
        }} className={`pane right-pane ${activePane === 'right' ? 'active-pane' : ''}`}>
          <div>Current Path: {rightCurrentPath}</div>

          <button onClick={goBackRightDir}>Go Back</button>
        <table className={activePane === 'right' ? 'active-table' : ''}>
          <thead>
          <tr>
            <th>Name</th>
            <th>Created</th>
            <th>Size</th>
          </tr>
          </thead>
          <tbody>
          {rightDirContents.map((item, index) => (
              <tr
                  key={index}
                  onDoubleClick={() => changeRightDir(item.name)}
                  onClick={(e) => selectRightItem(item, e.ctrlKey)}
                  className={rightSelectedItems.includes(item) && activePane === 'right' ? 'selected' : ''}>
                <td>
                <FontAwesomeIcon icon={getFileIcon(item.name)} /> {/* Display icon */}
                  {item.name}</td>
                <td>{item.creation_time}</td>
                <td>{formatBytes(item.size)}</td>
              </tr>
          ))}
          </tbody>
        </table>
      </div>
      </div>
      {isRenameDialogOpen && (
      <div className="rename-dialog">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button onClick={() => handleRenameOperation()}>Rename</button>
        <button onClick={() => setIsRenameDialogOpen(false)}>Cancel</button>

      </div>
    )}
      {isCreateDialogOpen && (
      <div className="create-dialog">
        <input
          type="text"
          placeholder={`Enter ${createType} name`}
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
        />
        <button onClick={handleCreateSubmit}>Create</button>
        <button onClick={() => setIsCreateDialogOpen(false)}>Cancel</button>
      </div>
    )}
    {isEditDialogOpen && (
  <div className="edit-dialog">
    <textarea
      value={fileContent}
      onChange={(e) => setFileContent(e.target.value)}
    />
    <button onClick={handleSaveFile}>Save</button>
    <button onClick={() => setIsEditDialogOpen(false)}>Cancel</button>
  </div>
)}
    </div>
  );

}

export default App;
