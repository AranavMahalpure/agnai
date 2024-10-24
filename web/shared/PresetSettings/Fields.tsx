import { Component, Show, createMemo, createSignal, onMount } from 'solid-js'
import { FLAI_CONTEXTS, GOOGLE_MODELS, PresetAISettings, ThirdPartyFormat } from '/common/adapters'
import { PresetProps } from './types'
import { AppSchema } from '/common/types/schema'
import TextInput from '../TextInput'
import Button, { ToggleButton } from '../Button'
import { getStore } from '/web/store/create'
import RangeInput from '../RangeInput'
import { settingStore, type UserState } from '/web/store'
import Select from '../Select'
import { MODEL_FORMATS } from './General'
import { defaultPresets } from '/common/default-preset'
import { FormLabel } from '../FormLabel'
import { SubscriptionModelLevel } from '/common/types/presets'
import { useValidServiceSetting } from '../util'
import { Card } from '../Card'
import PromptEditor from '../PromptEditor'
import { CustomSelect } from '../CustomSelect'
import { FeatherlessModel } from '/srv/adapter/featherless'

export type Field<T = {}> = Component<
  PresetProps & {
    mode: PresetAISettings['presetMode']
    pane: boolean
    setFormat: (format: ThirdPartyFormat) => void
    format?: ThirdPartyFormat
    tab: string
    sub?: AppSchema.SubscriptionModelOption
    user: UserState
  } & T
>

export const PresetMode: Component<{ inherit: PresetProps['inherit'] }> = (props) => {
  return (
    <div>
      <Select
        fieldName="presetMode"
        label="Preset Mode"
        helperText={`Toggle between using "essential options" and all available controls.`}
        value={props.inherit?.presetMode}
        items={[
          { label: 'Advanced', value: 'advanced' },
          { label: 'Simple', value: 'simple' },
        ]}
      />
    </div>
  )
}

export const ResponseLength: Field<{
  subMax: Partial<SubscriptionModelLevel>
  setTokens: (t: number) => void
}> = (props) => {
  return (
    <RangeInput
      fieldName="maxTokens"
      label="Response Length"
      helperText="Maximum length of the response. Measured in 'tokens'"
      min={16}
      max={1024}
      step={1}
      value={props.inherit?.maxTokens || 150}
      disabled={props.disabled}
      onChange={(val) => props.setTokens(val)}
      recommended={props.subMax.maxTokens}
      recommendLabel="Max"
    />
  )
}

export const ContextSize: Field<{ subMax: Partial<SubscriptionModelLevel> }> = (props) => {
  const maxCtx = createMemo(() => {
    const ctx = props.subMax.maxContextLength
    if (!ctx) return

    const max = Math.floor(ctx / 1000)
    return `${max}K`
  })

  return (
    <>
      <RangeInput
        fieldName="maxContextLength"
        label={
          <div class="flex gap-2">
            <div>
              Context Size{' '}
              <Show when={maxCtx()}>
                <span class="text-xs italic text-gray-500">(Max: {maxCtx()})</span>
              </Show>
            </div>

            <ToggleButton
              size="xs"
              fieldName="useMaxContext"
              onText="On"
              offText="Off"
              value={props.inherit?.useMaxContext}
            >
              Use Max If Known:
            </ToggleButton>
          </div>
        }
        helperText={
          <>
            <p>
              The amount of infomation sent to the model to generate a response.{' '}
              <Show when={props.service !== 'agnaistic'}>
                Check your AI service for the maximum context size.
              </Show>
            </p>
          </>
        }
        min={16}
        max={props.service === 'claude' ? 200000 : 32000}
        step={1}
        value={props.inherit?.maxContextLength || 4096}
        disabled={props.disabled}
      />
    </>
  )
}

export const SystemPrompt: Field = (props) => {
  const show = useValidServiceSetting('systemPrompt')

  return (
    <Card classList={{ hidden: !show() }}>
      <FormLabel
        label="System Prompt"
        helperText={<>The task the AI is performing. Leave blank if uncertain.</>}
      />
      <PromptEditor
        fieldName="systemPrompt"
        include={['char', 'user']}
        placeholder="Write {{char}}'s next reply in a fictional chat between {{char}} and {{user}}. Write 1 reply only in internet RP style, italicize actions, and avoid quotation marks. Use markdown. Be proactive, creative, and drive the plot and conversation forward. Write at least 1 paragraph, up to 4. Always stay in character and avoid repetition."
        value={props.inherit?.systemPrompt ?? ''}
        disabled={props.disabled}
      />
    </Card>
  )
}

export const Jailbreak: Field = (props) => {
  const show = useValidServiceSetting('ultimeJailbreak')

  return (
    <Card classList={{ hidden: !show() }}>
      <FormLabel
        label="Jailbreak (UJB)"
        helperText={
          <>
            <p>
              <b>Uncensored Models</b>: Typically stylstic instructions. E.g. "Respond succinctly
              using slang"
            </p>
            <p>
              <b>Censored Models</b>: Instructions to 'jailbreak' from filtering.
            </p>
            <p>Large jailbreak prompts can cause repetition. Use this prompt only if needed.</p>
          </>
        }
      />

      <PromptEditor
        fieldName="ultimeJailbreak"
        include={['char', 'user']}
        placeholder="Respond succinctly using slang"
        value={props.inherit?.ultimeJailbreak ?? ''}
        disabled={props.disabled}
      />
    </Card>
  )
}

export const ThirdPartyUrl: Field = (props) => {
  return (
    <TextInput
      fieldName="thirdPartyUrl"
      label="Third Party URL"
      helperText="API URL for third-party or self-hosted service"
      placeholder="E.g. https://some-tunnel-url.loca.lt"
      value={props.inherit?.thirdPartyUrl || ''}
      disabled={props.disabled}
      aiSetting={'thirdPartyUrl'}
      hide={
        props.format === 'featherless' || props.format === 'mistral' || props.format === 'gemini'
      }
      static
    />
  )
}

export const ThirdPartyKey: Field = (props) => {
  return (
    <>
      <TextInput
        fieldName="thirdPartyKey"
        label={
          <div class="mt-1 flex gap-4">
            <div>Third Party API Key</div>
            <Show when={props.inherit?._id}>
              <Button
                size="pill"
                onClick={() => getStore('presets').deleteUserPresetKey(props.inherit?._id!)}
              >
                Remove Key
              </Button>
            </Show>
          </div>
        }
        helperText="Never enter your official OpenAI, Claude, Mistral keys here."
        value={props.inherit?.thirdPartyKey}
        disabled={props.disabled}
        type="password"
        aiSetting={'thirdPartyKey'}
        static
      />
    </>
  )
}

export const ModelFormat: Field = (props) => {
  return (
    <>
      <Select
        fieldName="modelFormat"
        label="Prompt Format"
        helperMarkdown={`Which formatting method to use if using "universal tags" in your prompt template
      (I.e. \`<user>...</user>, <bot>...</bot>\`)`}
        items={MODEL_FORMATS}
        value={props.inherit?.modelFormat || 'Alpaca'}
        recommend={props.sub?.preset.modelFormat}
      />
    </>
  )
}

export const Temperature: Field = (props) => {
  return (
    <>
      <RangeInput
        fieldName="temp"
        label="Temperature"
        helperText="Creativity: Randomness of sampling. High values can increase creativity, but may make text less sensible. Lower values will make text more predictable."
        min={0.1}
        max={props.mode === 'simple' ? 1.5 : 10}
        step={0.01}
        value={props.inherit?.temp || defaultPresets.basic.temp}
        disabled={props.disabled}
        aiSetting={'temp'}
        recommended={props.sub?.preset.temp}
      />
    </>
  )
}

export const FeatherlessModels: Field = (props) => {
  const state = settingStore((s) => s.featherless)
  const [selected, setSelected] = createSignal(props.inherit?.featherlessModel || '')
  const [modelclass, setModelclass] = createSignal('')

  const label = createMemo(() => {
    const id = selected()
    const match = state.models.find((s) => s.id === id)
    if (!match) return id || 'None selected'

    return (
      <span title={`${match.status}, ${(match.health || '...').toLowerCase()}`}>
        {match.id}
        <span class="text-500 text-xs">
          {' '}
          {flaiContext(match, state.classes)} {match.status}
        </span>
      </span>
    )
  })

  const options = createMemo(() => {
    return state.models
      .filter((s) => {
        const mclass = modelclass()
        if (!mclass) return true
        return s.model_class === mclass
      })
      .map((s) => ({
        label: (
          <div
            class="flex w-full justify-between"
            title={`${s.status}, ${(s.health || '...').toLowerCase()}`}
          >
            <div class="ellipsis">{s.id}</div>
            <div class="text-500 text-xs">
              {flaiContext(s, state.classes)} {s.status}
            </div>
          </div>
        ),
        value: s.id,
      }))
  })

  onMount(() => {
    if (!state.models.length) {
      settingStore.getFeatherless()
    }
  })

  const search = (value: string, input: string) => {
    const res = input.split(' ').map((text) => new RegExp(text.replace(/\*/gi, '[a-z0-9]'), 'gi'))

    for (const re of res) {
      const match = value.match(re)
      if (!match) return false
    }

    return true
  }

  const classes = createMemo(() => {
    const list = Object.entries(state.classes)
      .map(([label, { ctx }]) => ({ label: `${label} - ${Math.round(ctx / 1024)}k`, value: label }))
      .sort((l, r) => l.label.localeCompare(r.label))
    return [{ label: 'All', value: '' }].concat(list)
  })

  return (
    <CustomSelect
      modalTitle="Select a Model"
      label="Featherless Model"
      fieldName="featherlessModel"
      value={props.inherit?.featherlessModel}
      options={options()}
      search={search}
      header={
        <Select
          items={classes()}
          value={''}
          label={'Filter: Model Class'}
          fieldName="featherless.classFilter"
          onChange={(ev) => setModelclass(ev.value)}
          parentClass="text-sm"
        />
      }
      onSelect={(opt) => {
        console.log(opt.value)
        setSelected(opt.value)
      }}
      buttonLabel={label()}
      selected={selected()}
      hide={props.service !== 'kobold' || props.format !== 'featherless'}
    />
  )
}

export const GoogleModels: Field = (props) => {
  const [selected, setSelected] = createSignal(props.inherit?.googleModel || '')
  const label = createMemo(() => {
    const id = selected()
    if (!id) return 'None Selected'
    const match = Object.values(GOOGLE_MODELS).find((model) => model.id === id)
    if (!match) return 'Invalid Model'
    return match.label
  })

  const options = createMemo(() => {
    const list = Object.values(GOOGLE_MODELS).map(({ label, id }) => ({ label, value: id }))
    return list
  })

  return (
    <CustomSelect
      modalTitle="Select a Model"
      label="Google Model"
      fieldName="googleModel"
      value={props.inherit?.googleModel || GOOGLE_MODELS.GEMINI_15_PRO.id}
      options={options()}
      search={(value, search) => value.toLowerCase().includes(search.toLowerCase())}
      onSelect={(opt) => setSelected(opt.value)}
      buttonLabel={label()}
      selected={selected()}
      hide={props.service !== 'kobold' || props.format !== 'gemini'}
    />
  )
}

function flaiContext(
  model: FeatherlessModel,
  classes: Record<string, { ctx: number; res: number }>
) {
  const ctx = model.ctx || classes[model.model_class]?.ctx || FLAI_CONTEXTS[model.model_class]
  if (!ctx) return ''

  return `${Math.round(ctx / 1024)}K`
}
