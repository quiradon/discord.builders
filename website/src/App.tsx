import {Capsule} from "components-sdk";
import {useCallback, useEffect, useMemo} from "react";
import {useDispatch, useSelector} from "react-redux";
import {actions, DisplaySliceManager, RootState} from "./state";
import {BetterInput} from "./BetterInput";
import {EmojiPicker} from "./EmojiPicker";
import {EmojiShow} from "./EmojiShow";
import Styles from './App.module.css'
import {webhookImplementation} from "./webhook.impl";
import {ErrorBoundary} from "react-error-boundary";

webhookImplementation.init();

function App() {
    const dispatch = useDispatch();
    const stateManager = useMemo(() => new DisplaySliceManager(dispatch), [dispatch]);
    const state = useSelector((state: RootState) => state.display.data)
    const webhookUrl = useSelector((state: RootState) => state.display.webhookUrl);
    const response = useSelector((state: RootState) => state.display.webhookResponse);

    const setFile = useCallback(webhookImplementation.setFile, []);
    const getFile = useCallback(webhookImplementation.getFile, [])
    useEffect(() => webhookImplementation.clean(state), [state]);

    let parsed_url: URL | null = null;
    try {
        parsed_url = new URL(webhookUrl);
        parsed_url.search = '?with_components=true'
    } catch (e) {}

    return <div className={Styles.app}>
        <ErrorBoundary fallback={<></>}>
            <Capsule state={state}
                     stateManager={stateManager}
                     stateKey={['data']}
                     getFile={getFile}
                     setFile={setFile}
                     BetterInput={BetterInput}
                     EmojiPicker={EmojiPicker}
                     EmojiShow={EmojiShow}
                     className={Styles.preview}
            />
        </ErrorBoundary>
        <div className={Styles.json}>
            <h1>Message builder</h1>
            <p style={{marginBottom: '2rem', marginTop: '1rem'}}>Warning: Non-link buttons and select menus are not
                allowed when sending message via webhook.</p>

            <div className={Styles.input_pair}>
                <div className={Styles.input}>
                    <input placeholder={"Webhook link"} type="text" value={webhookUrl}
                           onChange={ev => dispatch(actions.setWebhookUrl(ev.target.value))}/>
                </div>
                <button disabled={!parsed_url} onClick={async () => {
                    const req = await fetch(String(parsed_url), webhookImplementation.prepareRequest(state))

                    const status_code = req.status;
                    if (status_code === 204) return dispatch(actions.setWebhookResponse({"status": "204 Success"}));

                    const error_data = await req.json();
                    dispatch(actions.setWebhookResponse(error_data))
                }}>
                    Send
                </button>
            </div>

            {!!response && <div className={Styles.data}
                                style={{
                                    marginBottom: '2rem',
                                    color: '#dd9898'
                                }}>{JSON.stringify(response, undefined, 4)}</div>}
            <div className={Styles.data}>{JSON.stringify(state, undefined, 4)}</div>
        </div>
    </div>
}

export default App;
