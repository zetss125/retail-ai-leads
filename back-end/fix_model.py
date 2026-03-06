import json
import zipfile
import os

def fix_keras_model(model_path):
    temp_path = model_path + ".tmp"
    
    # .keras files are zip archives
    with zipfile.ZipFile(model_path, 'r') as zin:
        with zipfile.ZipFile(temp_path, 'w') as zout:
            for item in zin.infolist():
                buffer = zin.read(item.filename)
                if item.filename == 'config.json':
                    config = json.loads(buffer)
                    
                    # This helper removes the problematic key everywhere
                    def remove_key(obj):
                        if isinstance(obj, dict):
                            obj.pop('quantization_config', None)
                            for key in obj: remove_key(obj[key])
                        elif isinstance(obj, list):
                            for i in obj: remove_key(i)
                    
                    remove_key(config)
                    buffer = json.dumps(config).encode('utf-8')
                zout.writestr(item, buffer)
    
    os.replace(temp_path, model_path)
    print(f"✅ Model '{model_path}' has been sanitized and fixed!")

if __name__ == "__main__":
    fix_keras_model('omnilead_bi_model.keras')